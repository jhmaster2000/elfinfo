import * as ELF from './types/index.js';
import { HelperDataView, Reader } from './reader.js';
import { divide, toNumberSafe } from './biginthelpers.js';
import { decode } from './encoding.js';
import { RPL } from './rplsections.js';

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

export function readStringSection(section: ELF.Section): { [index: number]: string } {
    const tmp = section.data;
    const strings: { [index: number]: string; } = {};

    let ix = 0;
    for (let i = 0; i < section.size; i++) {
        if (tmp[i] === 0) {
            const slen = i - ix;
            if (slen > 0) strings[ix] = decode(tmp, ix, slen);
            ix = i + 1;
        }
    }
    return strings;
}

export function readSymbolsSection(section: ELF.Section, endian: ELF.Endian, bits: 32 | 64): ELF.Symbol[] {
    const num = divide(section.size, section.entSize);
    const symbols: ELF.Symbol[] = [];
    const view = HelperDataView(new DataView(section.data.buffer), endian === ELF.Endian.Big);
    
    let ix = 0;
    for (let i = 0; i < num; i++) {
        let name, info, other, shndx, value, size;
        if (bits === 32) {
            name  = view.readUInt32(ix); ix += 4;
            value = view.readUInt32(ix); ix += 4;
            size  = view.readUInt32(ix); ix += 4;
            info  = view.readUInt8(ix);  ix += 1;
            other = view.readUInt8(ix);  ix += 1;
            shndx = view.readUInt16(ix); ix += 2;
        } else {
            name  = view.readUInt32(ix); ix += 4;
            info  = view.readUInt8(ix);  ix += 1;
            other = view.readUInt8(ix);  ix += 1;
            shndx = view.readUInt16(ix); ix += 2;
            value = view.readUInt64(ix); ix += 8;
            size  = Number(view.readUInt64(ix)); ix += 8;
        }
        //const type = info & 0xF;
        //const binding = info >> 4;
        //const visibility = other & 3;

        let symbol = new ELF.Symbol(section.index);
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

export function readRelocationSection(section: ELF.Section, endian: ELF.Endian, bits: 32 | 64): ELF.Relocation[] {
    const num = toNumberSafe(divide(section.size, section.entSize));
    const relocations = new Array<ELF.Relocation>(num);
    const view = HelperDataView(new DataView(section.data.buffer), endian === ELF.Endian.Big);

    let ix = 0;
    for (let i = 0; i < num; i++) {
        let addr: number | bigint;
        let info: number | bigint;
        let addend: number | bigint | undefined;

        if (bits === 32) {
            addr = view.readUInt32(ix); ix += 4;
            info = view.readUInt32(ix); ix += 4;
            if (section.type === ELF.SectionType.Rela) addend = view.readSInt32(ix); ix += 4;
            //symbolIndex = info >> 8; //? 0x######00
            //type = info & 0xFF;      //? 0x000000##
        } else {
            addr = view.readUInt64(ix); ix += 8;
            info = view.readUInt64(ix); ix += 8;
            if (section.type === ELF.SectionType.Rela) addend = view.readSInt64(ix); ix += 8;
            //symbolIndex = toNumberSafe(info >> BigInt(32)); //? 0x########00000000
            //type = toNumberSafe(info & BigInt(0xFFFFFFFF)); //? 0x00000000########
        }

        let relocation = new ELF.Relocation();
        relocation.addr = addr;
        relocation.info = info;
        relocation.addend = addend;
        relocations[i] = relocation;
    }

    return relocations;
}

export async function readSectionHeaderEntries(fh: Reader, elfheader: ELF.Header, readSymbolData: boolean): Promise<ELF.Section[]> {
    const sh_entsize = elfheader.sectionHeadersEntrySize;
    const sh_num = elfheader.sectionHeadersEntryCount;
    if (sh_num === 0) return [];

    const result: ELF.Section[] = new Array(sh_num);

    for (let i = 0; i < sh_num; i++) {
        const view = HelperDataView(await fh.view(sh_entsize, Number(elfheader.sectionHeadersOffset) + i * Number(sh_entsize)), elfheader.endian === ELF.Endian.Big);
        const name = view.readUInt32(0);
        const type = view.readUInt32(4);

        let ix = 8;
        let flags, addr, offset, size, link, info, addralign, entsize;
        if (elfheader.bits === 32) {
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

    // process special sections
    for (const section of result) {
        if (isStringSection(section)) {
            if (section.flags & ELF.SectionFlags.Compressed) section.strings = {};
            else section.strings = readStringSection(section);
        }

        if (isSymbolSection(section)) {
            if (section.flags & ELF.SectionFlags.Compressed) section.symbols = [];
            else section.symbols = readSymbolsSection(section, elfheader.endian, elfheader.bits);
        }

        if (isRelocationSection(section)) {
            if (section.flags & ELF.SectionFlags.Compressed) section.relocations = [];
            else section.relocations = readRelocationSection(section, elfheader.endian, elfheader.bits);
        }

        if (elfheader.type === ELF.Type.RPL && elfheader.bits === 32) {
            if (RPL.isFileInfoSection(section)) section.fileinfo = RPL.readFileInfoSection(section, elfheader.endian);
        }
    }

    return result;
}

export function isStringSection(section: ELF.Section): section is ELF.StringSection {
    return section.type === ELF.SectionType.StrTab;
}

export function isSymbolSection(section: ELF.Section): section is ELF.SymbolSection {
    return section.type === ELF.SectionType.DynSym || section.type === ELF.SectionType.SymTab;
}

export function isRelocationSection(section: ELF.Section): section is ELF.RelocationSection {
    return section.type === ELF.SectionType.Rel ||
           section.type === ELF.SectionType.Rela;
}

export function parseSymInfo(symInfo: number): { symidx: number; type: number; } {
    return { symidx: symInfo >> 8, type: symInfo & 0xFF };
}

export function packSymInfo(symIdx: number, type: number): number {
    return Number('0x' + symIdx.toString(16).padStart(6, '0') + type.toString(16).padStart(2, '0'));
}

export function packStringSection(section: ELF.StringSection, size: number): Buffer {
    const buf: Buffer = Buffer.alloc(size);
    
    let ix = 1;
    for (let key in section.strings) {
        const str = section.strings[key];

        if (buf[ix] !== 0) throw new Error(
            `Failed to pack ELF because of corrupt string section of index ${section.index}:\n` +
            `\tString '${str}' at .strtab offset 0x${Number(key).toString(16).toUpperCase()} is overlapped by the previous string which is too long.`
        );
        ix += buf.write(str + '\0', ix);
    }
    return buf;
}

export function packSymbolSection(section: ELF.SymbolSection, size: number): Buffer {
    const buf: Buffer = Buffer.alloc(size);

    let ix = 0;
    for (let symbol of section.symbols) {
        buf.writeUInt32BE(symbol.nameOffset, ix);    ix += 4;
        buf.writeUInt32BE(Number(symbol.value), ix); ix += 4;
        buf.writeUInt32BE(symbol.size, ix);          ix += 4;
        buf.writeUInt8(<number>symbol.info, ix);     ix += 1;
        buf.writeUInt8(symbol.other, ix);            ix += 1;
        buf.writeUInt16BE(symbol.shndx, ix);         ix += 2;
    }
    return buf;
}

export function packRelocationSection(section: ELF.RelocationSection, size: number): Buffer {
    const buf: Buffer = Buffer.alloc(size);

    let ix = 0;
    for (let rel of section.relocations) {
        buf.writeUInt32BE(Number(rel.addr), ix); ix += 4;
        buf.writeUInt32BE(Number(rel.info), ix); ix += 4;
        if (rel.addend !== undefined) buf.writeInt32BE(Number(rel.addend), ix); ix += 4;
    }
    return buf;
}
