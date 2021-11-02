import assert from 'assert';
import { uint8, uint16, uint32, uint64 } from './primitive';
import * as Enums from './enums';
import { Structs } from './structs';
import { File } from './index';
import { getString } from '../sections';
import { StringSection, SymbolSection } from './sections.js';

/** Breakdown of symbol information stored on {@link Structs.Symbol._info} */
export interface SymbolInfo {
    binding: Enums.SymbolBinding; // info >> 4
    type: Enums.SymbolType;       // info & 0xF
}

/** A symbol, parsed from a symbol table. */
export class Symbol extends Structs.Symbol {
    constructor(symbolSection: number) { super(); this.symSection = symbolSection; }

    /** The section index of the symbol section this symbol is from */
    private readonly symSection: number;

    /** Get the symbol's name. */
    public getName(elf: File): string {
        if (!elf) return '';

        let symSection = elf.sections[this.symSection] as SymbolSection;
        let strSection = elf.sections[symSection.link] as StringSection;
        return getString(strSection.strings, this.nameOffset) || '';
    }

    /** The calculated virtual address for the symbol, if possible. */
    public virtualAddress?: uint32 | uint64;
    /** The data for the symbol, if any and only if it was specified to be loaded. */
    public data?: Uint8Array;

    /** The binding type of this symbol */
    get binding(): Enums.SymbolBinding { return this._info >> 4 }
    /** The type of this symbol */
    get type(): Enums.SymbolType { return this._info & 0xF }
    /** The visibility of the symbol. */
    get visibility(): Enums.SymbolVisibility { return this._other & 0x3; };

    /** Offset from the start of the {@link Section.link linked string table section} of 
      * this symbol's section, to the address of this symbol's name in said table, if any. */
    get nameOffset(): uint32 { return this._nameOffset }
    /** The value of this symbol. The interpretation of the value is dependent on a few things but is generally an offset or address. */
    get value(): uint32 | uint64 { return this._value }
    /** The size of this symbol, if applicable. */
    get size(): uint32 { return this._size }
    /** Symbol type specific information. */
    get info(): uint8 | SymbolInfo { return this._info }
    /** Other symbol information. */
    get other(): uint8 { return this._other }
    /** Section index for this symbol.
      * @summary This is the index of the section for this symbol. There
      * are also special values such as 0xFFF1 for an absolute index symbol
      * in a relocatable ELF file (object file). */
    get shndx(): uint16 { return this._shndx }

    set binding(binding: Enums.SymbolBinding) {
        this._info = (binding << 4) + (this._info & 0xF);
    }
    set type(type: Enums.SymbolType) {
        assert(type in Enums.SymbolType, `${type} is not a valid ELF.SymbolType value.`);
        this._info = (0x2C >> 4 << 4) + type;
    }
    set visibility(visibility: Enums.SymbolVisibility) {
        assert(visibility in Enums.SymbolVisibility, `${visibility} is not a valid ELF.SymbolVisibility value.`);
        this._other = (this._other >> 4 << 4) + visibility;
    };

    set nameOffset(nameOffset: uint32) {
        assert(nameOffset >= 0x00 && 0xFFFFFFFF >= nameOffset, `${nameOffset} does not fit inside a uint32.`);
        this._nameOffset = nameOffset;
    }
    set value(value: uint32 | uint64) {
        assert(value >= 0x00 && 0xFFFFFFFF >= value, `${value} does not fit inside a uint32.`);
        this._value = value;
    }
    set size(size: uint32) {
        assert(size >= 0x00 && 0xFFFFFFFF >= size, `${size} does not fit inside a uint32.`);
        this._size = size;
    }
    set info(info: uint8 | SymbolInfo) {
        if (typeof info === 'object') info = (info.binding << 4) + info.type;
        assert(info >= 0x00 && 0xFF >= info, `${info} does not fit inside a uint8.`);

        let [bind, type] = info.toString(16).padStart(2, '0').split('');
        assert(bind in Enums.SymbolBinding, `${bind} (From ${info} >> 4) is not a valid ELF.SymbolBinding value.`);
        assert(type in Enums.SymbolType, `${type} (From ${info} & 0xF) is not a valid ELF.SymbolType value.`);
        this._info = info;
    }
    set other(other: uint8) {
        assert(other >= 0x00 && 0xFF >= other, `${other} does not fit inside a uint8.`);
        assert((other & 0x3) in Enums.SymbolVisibility, `${other & 0x3} (From ${other} & 0x3) is not a valid ELF.SymbolVisibility value.`);
        this._other = other;
    }
    set shndx(shndx: uint16) {
        assert(shndx >= 0x00 && 0xFFFF >= shndx, `${shndx} does not fit inside a uint16.`);
        this._shndx = shndx;
    }
}
