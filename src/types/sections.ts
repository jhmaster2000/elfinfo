import assert from 'assert';
import { uint16, uint32, uint64 } from './primitive';
import { RPLFileInfo } from './rplfileinfo';
import { Structs } from './structs';
import { Symbol as ELFSymbol } from './symbol';
import * as Enums from './enums';
import { Relocation } from './relocation';
import { File } from './index';
import { isStringSection, getString } from '../sections';

export class Section extends Structs.Section {
    constructor() { super(); }

    /** Get the section's name. */
    public getName(elf: File): string {
        if (elf.header.shstrIndex >= elf.sections.length) throw new Error('Invalid ELF file. Section header string table index is invalid.');

        const strSection = elf.sections[elf.header.shstrIndex];
        if (!isStringSection(strSection)) throw new Error('Invalid ELF file. Section header string table index is not a string table.');

        if (strSection.strings) {
            if (this.nameOffset === 0) return this.type ? 'SECTION' + this.index : '<null>';
            else return getString(strSection.strings, this.nameOffset);;
        }
        return '<null>';
    }

    /** The index of this section */
    public index: number = -1;
    public data: Uint8Array = new Uint8Array();

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
    get size() { return this._size }
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
        this._size = size;
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

    /** The CRC hashes of this RPL */
    crcs: uint16[] = [];
}

/** RPL-exclusive file information section. */
export class RPLFileInfoSection extends Section {
    constructor() { super(); }

    /** The parsed RPL file information. */
    fileinfo: RPLFileInfo = new RPLFileInfo();
}
