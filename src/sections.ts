import * as ELF from './types/index.js';
import { HelperDataView, Reader } from './reader.js';
import { divide, toNumberSafe } from './biginthelpers.js';
import { decode, encode } from './encoding.js';
import { RPL } from './rplsections.js';
import { writeBufferToBuffer } from './writer.js';

//const MAX_SECTION_LOAD_SIZE = 0x1000000;

export function getString(strings: { [index: number]: string; }, index: number): string {
    if (!Object.keys(strings).length) return '<compressed>';
    let str = strings[index];
    if (!str) {
        // both GCC and clang have a tendency to
        // point to the middle of a string if the
        // end part is what's needed
        for (const key in strings) {
            const kv = parseInt(key);
            if (kv < index) {
                const ss = strings[kv];
                if (kv + ss.length > index) {
                    str = ss.substr(index - kv); break;
                }
            }
        }
    }
    return str || '<error>';
}

export async function readStringSection(section: ELF.Section, fh?: Reader): Promise<{ [index: number]: string }> {
    const tmp = fh ? await fh.read(Number(section.size), Number(section.offset)) : section.data;
    let ix = 0;
    const strings: {
        [index: number]: string;
    } = {};
    for (let i = 0; i < section.size; i++) {
        if (tmp[i] === 0) {
            const slen = i - ix;
            if (slen > 0) {
                strings[ix] = decode(tmp, ix, slen);
            }
            ix = i + 1;
        }
    }
    return strings;
}

export async function readSymbolsSection(fh: Reader | Uint8Array, offset: number, size: number,
    entsize: number, bigEndian: boolean, bits: number, sectionIndex: number): Promise<ELF.Symbol[]> {

    const num = divide(size, entsize);
    const symbols: ELF.Symbol[] = [];
    for (let i = 0; i < num; i++) {
        const view = HelperDataView(fh instanceof Uint8Array ? new DataView(fh.buffer) : await fh.view(entsize, offset + i * entsize), bigEndian);

        let ix = 0;

        let name, info, other, shndx, value, size;
        if (bits === 32) {
            name  = view.readUInt32(ix); ix += 4;
            value = view.readUInt32(ix); ix += 4;
            size  = view.readUInt32(ix); ix += 4;
            info  = view.readUInt8(ix); ix += 1;
            other = view.readUInt8(ix); ix += 1;
            shndx = view.readUInt16(ix); ix += 2;
        } else {
            name =  view.readUInt32(ix); ix += 4;
            info =  view.readUInt8(ix); ix += 1;
            other = view.readUInt8(ix); ix += 1;
            shndx = view.readUInt16(ix); ix += 2;
            value = view.readUInt64(ix); ix += 8;
            size = Number(view.readUInt64(ix)); ix += 8;
        }
        //const type = info & 0xF;
        //const binding = info >> 4;
        //const visibility = other & 3;

        let symbol = new ELF.Symbol(sectionIndex);
        symbol.nameOffset = name;
        symbol.info = info;
        symbol.other = other;
        symbol.shndx = shndx;
        symbol.value = value;
        symbol.size = size;
        symbols[i] = symbol;
    }

    return symbols;
}

export async function readRelocationSection(fh: Reader | Uint8Array, offset: number, size: number,
    entsize: number, bigEndian: boolean, bits: number, rela: boolean): Promise<ELF.Relocation[]> {

    const num = toNumberSafe(divide(size, entsize));
    const relocations = new Array<ELF.Relocation>(num);

    for (let i = 0; i < num; i++) {
        const view = HelperDataView(fh instanceof Uint8Array ? new DataView(fh.buffer) : await fh.view(entsize, offset + i * entsize), bigEndian);

        let ix = 0;
        let addr: number | bigint, info: number | bigint, symbolIndex: number, type: number;
        let addend: number | bigint | undefined;

        if (bits === 32) {
            addr = view.readUInt32(ix); ix += 4;
            info = view.readUInt32(ix); ix += 4;

            if (rela) addend = view.readSInt32(ix); ix += 4;

            symbolIndex = info >> 8; //? 0x######00
            type = info & 0xFF;      //? 0x000000##
        } else {
            addr = view.readUInt64(ix); ix += 8;
            info = view.readUInt64(ix); ix += 8;

            if (rela) addend = view.readSInt64(ix); ix += 8;

            symbolIndex = toNumberSafe(info >> BigInt(32)); //? 0x########00000000
            type = toNumberSafe(info & BigInt(0xFFFFFFFF)); //? 0x00000000########
        }

        let relocation = new ELF.Relocation();
        relocation.addr = addr;
        relocation.info = info;
        relocation.addend = addend;
        relocation.symbolIndex = symbolIndex;
        relocation.type = type;
        relocations[i] = relocation;
    }

    return relocations;
}

/*function fillInSymbolNames(symbols: ELF.Symbol[], strings?: { [index: number]: string; }) {
    if (!strings) return;

    for (let i = 0; i < symbols.length; i++) {
        symbols[i].name = getString(strings, symbols[i].nameOffset) || '';
    }
}*/

export async function readSectionHeaderEntries(fh: Reader, sh_off: number | bigint, sh_entsize: number, sh_num: number, bits: number,
    bigEndian: boolean, eSHStrNdx: number, readSymbolData: boolean, elfType: ELF.Type): Promise<ELF.Section[]> {

    if (sh_num === 0) return [];

    const result: ELF.Section[] = new Array(sh_num);

    for (let i = 0; i < sh_num; i++) {
        const view = HelperDataView(await fh.view(sh_entsize, Number(sh_off) + i * Number(sh_entsize)), bigEndian);

        const name = view.readUInt32(0);
        const type = view.readUInt32(4);

        let ix = 8;
        let flags, addr, offset, size, link, info, addralign, entsize;
        if (bits === 32) {
            flags     = view.readUInt32(ix); ix += 4;
            addr      = view.readUInt32(ix); ix += 4;
            offset    = view.readUInt32(ix); ix += 4;
            size      = view.readUInt32(ix); ix += 4;
            link      = view.readUInt32(ix); ix += 4;
            info      = view.readUInt32(ix); ix += 4;
            addralign = view.readUInt32(ix); ix += 4;
            entsize   = view.readUInt32(ix); ix += 4;
        } else {
            flags     = toNumberSafe(view.readUInt64(ix)); ix += 8;
            addr      = view.readUInt64(ix); ix += 8;
            offset    = toNumberSafe(view.readUInt64(ix)); ix += 8;
            size      = toNumberSafe(view.readUInt64(ix)); ix += 8;
            link      = view.readUInt32(ix); ix += 4;
            info      = view.readUInt32(ix); ix += 4;
            addralign = toNumberSafe(view.readUInt64(ix)); ix += 8;
            entsize   = toNumberSafe(view.readUInt64(ix)); ix += 8;
        }

        let section = new ELF.Section();
        section.data = offset === 0 ? new Uint8Array(0) : new Uint8Array(view.buffer.slice(offset, offset + size));
        section.index = i;
        section.nameOffset = name;
        section.type = type;
        section.flags = flags;
        section.addr = addr;
        section.offset = offset;
        section.size = size;
        section.link = link;
        section.info = info;
        section.addrAlign = addralign;
        section.entSize = entsize;

        result[i] = section;
    }

    // process string tables
    for (const section of result) {
        if (isStringSection(section)) {
            if (section.flags & ELF.SectionFlags.Compressed) section.strings = {};
            else section.strings = await readStringSection(section, fh);
        }
    }

    // process symbol sections and relocation sections
    for (const section of result) {
        if (isSymbolSection(section)) {
            const { index, size, offset, entSize, link } = section;
            if (section.flags & ELF.SectionFlags.Compressed) section.symbols = [];
            else section.symbols = await readSymbolsSection(fh, offset, size, entSize, bigEndian, bits, index);

            /*if (link >= 0 && link < result.length) {
                const stringsSection = result[link];
                if (isStringSection(stringsSection)) {
                    //fillInSymbolNames(section.symbols, stringsSection.strings);
                } else {
                    // TODO: error: linked section is not a string table
                }
            }*/
        }

        if (isRelocationSection(section)) {
            const { size, offset, entSize } = section;
            if (section.flags & ELF.SectionFlags.Compressed) section.relocations = [];
            else section.relocations = await readRelocationSection(fh, offset, size, entSize, bigEndian, bits, section.type === ELF.SectionType.Rela);
        }
    }

    // process RPL sections
    if (elfType === ELF.Type.RPL && bits === 32) {
        for (const section of result) {
            if (RPL.isCrcSection(section)) {
                const { size, offset, entSize } = section;
                section.crcs = await RPL.readCrcSection(fh, offset, size, entSize, bigEndian);
            }

            if (RPL.isFileInfoSection(section)) {
                const { size, offset } = section;
                section.fileinfo = await RPL.readFileInfoSection(fh, offset, size, bigEndian);
            }
        }
    }

    //fillInSectionHeaderNames(result, eSHStrNdx);

    return result;
}

/*function fillInSectionHeaderNames(sections: ELF.Section[], eSHStrNdx: number) {
    if (eSHStrNdx < sections.length) {
        const stringsSection = sections[eSHStrNdx];
        if (isStringSection(stringsSection)) {
            const strs = stringsSection.strings;
            if (strs) {
                sections.forEach(v => {
                    if (v.nameOffset === 0) {
                        v.name = v.type ? 'SECTION' + v.index : '<null>';
                    } else {
                        const name = getString(strs, v.nameOffset);
                        if (name) v.name = name;
                    }
                });
            }
        } else {
            // TODO: error: eSHStrNdx is not a string table
        }
    }
}*/

export function isStringSection(section: ELF.Section): section is ELF.StringSection {
    return section?.type === ELF.SectionType.StrTab;
}

export function isSymbolSection(section: ELF.Section): section is ELF.SymbolSection {
    return section?.type === ELF.SectionType.DynSym ||
           section?.type === ELF.SectionType.SymTab;
}

export function isRelocationSection(section: ELF.Section): section is ELF.RelocationSection {
    return section?.type === ELF.SectionType.Rel ||
           section?.type === ELF.SectionType.Rela;
}

export function parseSymInfo(symInfo: number): { symidx: number; type: number; } {
    return { symidx: symInfo >> 8, type: symInfo & 0xFF };
}

export function packSymInfo(symIdx: number, type: number): number {
    return Number('0x' + symIdx.toString(16).padStart(6, '0') + type.toString(16).padStart(2, '0'));
}

export function packStringSection(section: ELF.StringSection): Buffer {
    const strbuf: Buffer = Buffer.alloc(section.size);
    let ix = 1;

    for (let key in section.strings) {
        const addr = Number(key);
        const str = section.strings[key];
        const encoded = encode(str);

        if (strbuf[ix] !== 0) throw new Error(
            `Failed to pack ELF because of corrupt string section of index ${section.index}:\n` +
            `\tString '${str}' at .strtab offset 0x${addr.toString(16).toUpperCase()} is overlapped by the previous string which is too long.`
        );

        writeBufferToBuffer(strbuf, encoded, ix); ix += encoded.byteLength;
        writeBufferToBuffer(strbuf, encode('\0'), ix); ix += 1;
    }

    return strbuf;
}

export function packSymbolSection(section: ELF.SymbolSection): Buffer {
    const symbuf: Buffer = Buffer.alloc(section.size);
    let ix = 0;

    for (let symbol of section.symbols) {
        writeBufferToBuffer(symbuf, encode(symbol.nameOffset, 4), ix); ix += 4;
        writeBufferToBuffer(symbuf, encode(Number(symbol.value), 4), ix); ix += 4;
        writeBufferToBuffer(symbuf, encode(symbol.size, 4), ix); ix += 4;
        writeBufferToBuffer(symbuf, encode(<number>symbol.info, 1), ix); ix += 1;
        writeBufferToBuffer(symbuf, encode(symbol.other, 1), ix); ix += 1;
        writeBufferToBuffer(symbuf, encode(symbol.shndx, 2), ix); ix += 2;
    }

    return symbuf;
}

export function packRelocationSection(section: ELF.RelocationSection): Buffer {
    const relbuf: Buffer = Buffer.alloc(section.size);
    let ix = 0;

    for (let rel of section.relocations) {
        writeBufferToBuffer(relbuf, encode(Number(rel.addr), 4), ix); ix += 4;
        writeBufferToBuffer(relbuf, encode(Number(rel.info), 4), ix); ix += 4;
        if (rel.addend !== undefined) {
            writeBufferToBuffer(relbuf, encode(Number(rel.addend), 4, true), ix); ix += 4;
        }
    }
    return relbuf;
}
