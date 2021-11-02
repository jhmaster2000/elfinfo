import * as ELF from './types';
import { Reader } from './reader';
import { divide, toNumberSafe } from './biginthelpers';
import { decode, encode } from './encoding';
import { RPL } from './rplsections';
import { writeBufferToBuffer } from './writer';

//const MAX_SECTION_LOAD_SIZE = 0x1000000;

export function getString(strings: { [index: number]: string; }, index: number): string {
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
    return str;
}

async function readStringSection(fh: Reader, offset: number | bigint, size: number | bigint): Promise<{ [index: number]: string }> {
    const tmp = await fh.read(Number(size), Number(offset));
    let ix = 0;
    const strings: {
        [index: number]: string;
    } = {};
    for (let i = 0; i < size; i++) {
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

async function readSymbolsSection(fh: Reader, offset: number, size: number,
    entsize: number, bigEndian: boolean, bits: number, sectionIndex: number): Promise<ELF.Symbol[]> {

    const fhsize = fh.size();
    const num = divide(size, entsize);
    let ix = 0;
    const symbols: ELF.Symbol[] = [];
    for (let i = 0; i < num; i++) {
        const view = await fh.view(entsize, offset + i * entsize);
        const readUint8 = view.getUint8.bind(view);
        const readUInt16 = (ix: number) => view.getUint16(ix, !bigEndian);
        const readUInt32 = (ix: number) => view.getUint32(ix, !bigEndian);
        const readUInt64 = (ix: number) => view.getBigUint64(ix, !bigEndian);

        let ix = 0;

        let name, info, other, shndx, value, size;
        if (bits === 32) {
            name = readUInt32(ix); ix += 4;
            value = readUInt32(ix); ix += 4;
            size = readUInt32(ix); ix += 4;
            info = readUint8(ix); ix += 1;
            other = readUint8(ix); ix += 1;
            shndx = readUInt16(ix); ix += 2;
        } else {
            name = readUInt32(ix); ix += 4;
            info = readUint8(ix); ix += 1;
            other = readUint8(ix); ix += 1;
            shndx = readUInt16(ix); ix += 2;
            value = readUInt64(ix); ix += 8;
            size = Number(readUInt64(ix)); ix += 8;
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

async function readRelocationSection(fh: Reader, offset: number, size: number,
    entsize: number, bigEndian: boolean, bits: number, rela: boolean): Promise<ELF.Relocation[]> {

    const num = toNumberSafe(divide(size, entsize));
    const relocations = new Array<ELF.Relocation>(num);

    for (let i = 0; i < num; i++) {
        const view = await fh.view(entsize, offset + i * entsize);
        const readUInt32 = (ix: number) => view.getUint32(ix, !bigEndian);
        const readUInt64 = (ix: number) => view.getBigUint64(ix, !bigEndian);
        const readSInt32 = (ix: number) => view.getInt32(ix, !bigEndian);
        const readSInt64 = (ix: number) => view.getBigInt64(ix, !bigEndian);

        let ix = 0;
        let addr: number | bigint, info: number | bigint, symbolIndex: number, type: number;
        let addend: number | bigint | undefined;

        if (bits === 32) {
            addr = readUInt32(ix); ix += 4;
            info = readUInt32(ix); ix += 4;

            if (rela) addend = readSInt32(ix); ix += 4;

            symbolIndex = info >> 8; //? 0x######00
            type = info & 0xFF;      //? 0x000000##
        } else {
            addr = readUInt64(ix); ix += 8;
            info = readUInt64(ix); ix += 8;

            if (rela) addend = readSInt64(ix); ix += 8;

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

export async function readSectionHeaderEntries(fh: Reader,
    sh_off: number | bigint, sh_entsize: number, sh_num: number,
    bits: number, bigEndian: boolean, eSHStrNdx: number,
    readSymbolData: boolean, elfType: ELF.Type): Promise<ELF.Section[]> {

    if (sh_num === 0) return [];

    const result: ELF.Section[] = new Array(sh_num);

    for (let i = 0; i < sh_num; i++) {
        const view = await fh.view(sh_entsize, Number(sh_off) + i * Number(sh_entsize));
        const readUInt32 = (ix: number) => view.getUint32(ix, !bigEndian);
        const readUInt64 = (ix: number) => view.getBigUint64(ix, !bigEndian);

        const name = readUInt32(0);
        const type = readUInt32(4);

        let ix = 8;
        let flags, addr, offset, size, link, info, addralign, entsize;
        if (bits === 32) {
            flags = readUInt32(ix); ix += 4;
            addr = readUInt32(ix); ix += 4;
            offset = readUInt32(ix); ix += 4;
            size = readUInt32(ix); ix += 4;
            link = readUInt32(ix); ix += 4;
            info = readUInt32(ix); ix += 4;
            addralign = readUInt32(ix); ix += 4;
            entsize = readUInt32(ix); ix += 4;
        } else {
            flags = toNumberSafe(readUInt64(ix)); ix += 8;
            addr = readUInt64(ix); ix += 8;
            offset = toNumberSafe(readUInt64(ix)); ix += 8;
            size = toNumberSafe(readUInt64(ix)); ix += 8;
            link = readUInt32(ix); ix += 4;
            info = readUInt32(ix); ix += 4;
            addralign = toNumberSafe(readUInt64(ix)); ix += 8;
            entsize = toNumberSafe(readUInt64(ix)); ix += 8;
        }

        let section = new ELF.Section();
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
        section.data = offset === 0 ? Buffer.alloc(0) : Buffer.from(view.buffer.slice(offset, offset + size))

        result[i] = section;
    }

    // process string tables
    for (const section of result) {
        if (isStringSection(section)) {
            const { size, offset } = section;
            section.strings = await readStringSection(fh, offset, size);
        }
    }

    // process symbol sections and relocation sections
    for (const section of result) {
        if (isSymbolSection(section)) {
            const { index, size, offset, entSize, link } = section;
            section.symbols = await readSymbolsSection(fh, offset, size, entSize, bigEndian, bits, index);

            if (link >= 0 && link < result.length) {
                const stringsSection = result[link];
                if (isStringSection(stringsSection)) {
                    //fillInSymbolNames(section.symbols, stringsSection.strings);
                } else {
                    // TODO: error: linked section is not a string table
                }
            }
        }

        if (isRelocationSection(section)) {
            const { size, offset, entSize } = section;
            section.relocations = await readRelocationSection(fh, offset, size, entSize, bigEndian, bits, section.type === ELF.SectionType.Rela);
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
