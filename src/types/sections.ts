import assert from 'assert';
import { uint16, uint32, uint64 } from './primitive.js';
import { RPLFileInfo } from './rplfileinfo.js';
import { Structs } from './structs.js';
import { Symbol as ELFSymbol } from './symbol.js';
import * as Enums from './enums.js';
import { Relocation } from './relocation.js';
import { File } from './index.js';
import { isStringSection, getString } from '../sections.js';
import { trimBuffer } from '../encoding.js';
import hashwasm from 'hash-wasm';
import zlib from 'zlib';

export class Section extends Structs.Section {
    constructor() { super(); }

    /** Get the section's name. */
    public getName(elf: File): '<null>' | '<compressed>' | string {
        if (elf.header.shstrIndex >= elf.sections.length) throw new Error('Invalid ELF file. Section header string table index is invalid.');
        if (elf.header.shstrIndex === 0) return 'SECTION' + this.index;

        const shstrtab = elf.sections[elf.header.shstrIndex];
        if (!isStringSection(shstrtab)) throw new Error('Invalid ELF file. Section header string table index is not a string table.');
        if (shstrtab.flags & Enums.SectionFlags.Compressed) return '<compressed>';

        if (this.nameOffset === 0) return this.type ? 'SECTION' + this.index : '<null>';
        else return getString(shstrtab.strings, this.nameOffset);
    }

    /** The index of this section */
    public index: number = -1;
    /** The raw binary data of this section */
    public data: Uint8Array = new Uint8Array(0);

    /** The uncompressed size of this section in bytes, if it's compressed.
      * If the section is not compressed, this is identical to {@link Section.size}. */
    get sizeUncompressed(): number {
        if (!(this.flags & Enums.SectionFlags.Compressed)) return this.size;
        if (this.data.byteLength < 4) throw new Error('Invalid or corrupt ELF section. Section is flagged as compressed, but is too small.');
        return new DataView(this.data).getUint32(0);
    }

    get crc32Hash(): Promise<number> {
        return (async () => {
            if (this.type === Enums.SectionType.RPLCrcs || this.offset === 0 || this.data.length === 0) return 0x00000000;

            let data: Uint8Array = this.data;
            if (this.flags & Enums.SectionFlags.Compressed) data = new Uint8Array(trimBuffer(zlib.inflateSync(this.data.slice(4))));

            return Number('0x' + await hashwasm.crc32(data));
        })();
    }


    /** Offset from the start of the {@link Header.shstrIndex section headers string table} 
      * to the address of this section's name in said table, if any. */
    get nameOffset() { return this._nameOffset }
    /** The type of this section. */
    get type() { return this._type }
    /** The flags for this section. */
    get flags() { return this._flags }
    /** The virtual address of this section. */
    get addr() { return this._addr }
    /** The absolute offset of the section in the file. */
    get offset() { return this._offset }
    /** The size of this section, in bytes. */
    get size() { return this.offset === 0 ? this._size : this.data.byteLength }
    /** A section linked to this section. For example for a symbol section the
      * linked section is a string table section providing names for symbols. */
    get link() { return this._link }
    /** Section type specific info for this section. */
    get info() { return this._info }
    /** The alignment requirement of this section. */
    get addrAlign() { return this._addrAlign }
    /** The size of each "entity" in this section, if applicable.
      * For example, if this is a symbol table section, this is the size of a symbol entry. */
    get entSize() { return this._entSize }

    set nameOffset(nameOffset: uint32) {
        assert(nameOffset >= 0x00 && 0xFFFFFFFF >= nameOffset, `${nameOffset} does not fit inside a uint32.`);
        this._nameOffset = nameOffset;
    }
    set type(type: Enums.SectionType) {
        assert(type in Enums.SectionType, `${type} is not a valid ELF.SectionType value.`);
        this._type = type;
    }
    set flags(flags: uint32) {
        assert(flags >= 0x00 && 0xFFFFFFFF >= flags, `${flags} does not fit inside a uint32.`);
        this._flags = flags;
    }
    set addr(addr: uint32 | uint64) {
        assert(addr >= 0x00 && 0xFFFFFFFF >= addr, `${addr} does not fit inside a uint32.`);
        this._addr = addr;
    }
    set offset(offset: uint32) {
        assert(offset >= 0x00 && 0xFFFFFFFF >= offset, `${offset} does not fit inside a uint32.`);
        this._offset = offset;
    }
    set size(size: uint32) {
        assert(size >= 0x00 && 0xFFFFFFFF >= size, `${size} does not fit inside a uint32.`);
        if (this.offset === 0) {
            this._size = size; return;
        }
        if (size === this.data.byteLength) return;
        if (size > this.data.byteLength)
            this.data = new Uint8Array(trimBuffer(Buffer.concat([new Uint8Array(this.data), new Uint8Array(size - this.data.byteLength)])));
        else
            this.data = new Uint8Array(this.data.slice(0, size));
    }
    set link(link: uint32) {
        assert(link >= 0x00 && 0xFFFFFFFF >= link, `${link} does not fit inside a uint32.`);
        this._link = link;
    }
    set info(info: uint32) {
        assert(info >= 0x00 && 0xFFFFFFFF >= info, `${info} does not fit inside a uint32.`);
        this._info = info;
    }
    set addrAlign(addrAlign: uint32) {
        assert(addrAlign >= 0x00 && 0xFFFFFFFF >= addrAlign, `${addrAlign} does not fit inside a uint32.`);
        this._addrAlign = addrAlign;
    }
    set entSize(entSize: uint32) {
        assert(entSize >= 0x00 && 0xFFFFFFFF >= entSize, `${entSize} does not fit inside a uint32.`);
        this._entSize = entSize;
    }
}

/** A string table section. */
export class StringSection extends Section {
    constructor() { super(); }

    /** The strings parsed from this section in the case of a string table section. */
    strings: { [index: number]: string } = {};
}

/** A symbol table section. */
export class SymbolSection extends Section {
    constructor() { super(); }

    /** The symbols parsed from this section. */
    symbols: ELFSymbol[] = [];
}

/** A relocation table section. */
export class RelocationSection extends Section {
    constructor() { super(); }

    /** The relocations parsed from this section. */
    relocations: Relocation[] = [];
}

/** RPL-exclusive CRC hashes section. */
export class RPLCrcSection extends Section {
    constructor() { super(); }
}

/** RPL-exclusive file information section. */
export class RPLFileInfoSection extends Section {
    constructor() { super(); }

    /** The parsed RPL file information. */
    fileinfo: RPLFileInfo = new RPLFileInfo();
}
