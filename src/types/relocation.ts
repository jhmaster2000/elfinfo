import assert from 'assert';
import { uint8, uint32, uint64, sint32, sint64 } from './primitive';
import { Structs } from './structs';

/** Breakdown of relocation information stored on {@link Structs.Relocation._info} */
export interface RelocationInfo {
    symbolIndex: number; // info >> 8
    type: uint8;         // info & 0xFF
}

/** A relocation as found in a relocation section.
  * @summary if the section is a REL section, addend will be undefined.
  * If the section is a RELA section, addend will be set. */
export class Relocation extends Structs.Relocation {
    constructor() { super() }

    /**
      * The location at which to apply the relocation action.
      * @summary This member gives the location at which to apply the relocation action.
      * For a relocatable file, the value is the byte offset from the beginning of the section
      * to the storage unit affected by the relocation. For an executable file or a shared object,
      * the value is the virtual address of the storage unit affected by the relocation. */
    get addr(): uint32 | uint64 { return this._addr };
    /** The symbol table index with respect to which the
      * relocation must be made, and the type of relocation to apply.
      * @summary This member gives both the symbol table index with respect to which the
      * relocation must be made, and the type of relocation to apply. For example,
      * a call instruction's relocation entry would hold the symbol table index of
      * the function being called. If the index is STN_UNDEF, the undefined symbol
      * index, the relocation uses 0 as the symbol value. Relocation types are
      * processor-specific; descriptions of their behavior appear in the processor
      * supplement. When the text in the processor supplement refers to a
      * relocation entry's relocation type or symbol table index, it means the result
      * of applying ELF32_R_TYPE or ELF32_R_SYM, respectively, to the entry's r_info member. */
    get info(): uint32 | uint64 | RelocationInfo { return this._info };
    /** A constant addend used to compute the value to be stored into the relocatable field. */
    get addend(): sint32 | sint64 | undefined { return this._addend };

    /** The symbol index for this relocation.
      * @summary The symbol for this relocation is found in the section identified
      * by the info field in the section this relocation is found in.
      * The symbol index is taken from the info field. */
    get symbolIndex(): number { return <uint32>this._info >> 8 };
    /** The type of this relocation.
      * @summary Relocation types are processor specific so the raw number is given here.
      * The relocation type is take from the info field */
    get type(): uint8 { return <uint32>this._info & 0xFF };

    set addr(addr: uint32 | uint64) {
        assert(addr >= 0x00 && 0xFFFFFFFF >= addr, `${addr} does not fit inside a uint32.`);
        this._addr = addr;
    }
    set info(info: uint32 | uint64 | RelocationInfo) {
        if (typeof info === 'object') info = (info.symbolIndex << 8) + info.type;
        assert(info >= 0x00 && 0xFFFFFFFF >= info, `${info} does not fit inside a uint32.`);
        this._info = info;
    }
    set addend(addend: sint32 | sint64 | undefined) {
        if (addend === undefined) return;
        assert(addend >= -0x80000000 && 0x7FFFFFFF >= addend, `${addend} does not fit inside a sint32.`);
        this._addend = addend;
    }

    set symbolIndex(symbolIndex: number) {
        assert(symbolIndex >= 0x00 && 0xFFFFFF >= symbolIndex, `${symbolIndex} does not fit inside a 24-bit value.`);
        this._info = (symbolIndex << 8) + (<uint32>this._info & 0xFF);
    }
    set type(type: uint8) {
        assert(type >= 0x00 && 0xFF >= type, `${type} does not fit inside a uint8.`);
        this._info = (<uint32>this._info & 0xFFFFFF00) + type;
    }
}
