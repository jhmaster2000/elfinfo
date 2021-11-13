import { uint8, uint16, uint32, uint64, sint32, sint64 } from './primitive.js';
import * as Enums from './enums.js';

export namespace Structs {
    export class Header {
        /** The magic number of the ELF file, always '\x7FELF'. */
        readonly magic = '\x7FELF' as const;                 //! uint32
        /** The architecture of the ELF file, either 32 or 64 bits. */
        protected _class: Enums.Class = Enums.Class.None;                 //* uint8
        /** The endianness of the data in the ELF file. */
        protected _endian: Enums.Endian = Enums.Endian.None;              //* uint8
        /** The version of the ELF file. There is currently only one version. */
        protected _version: Enums.Version = Enums.Version.None;           //* uint8
        /** The ABI (Application Binary Interface) of this ELF file. This is typically not used and set to SystemV. */
        protected _abi: Enums.ABI = Enums.ABI.SystemV;                    //* uint8
        /** The ABI version. This is ABI specific data but is generally not used. */
        protected _abiVersion: uint8 = 0x00;                  //* uint8
        /** 7 null bytes of padding. */
        readonly padding = '\0\0\0\0\0\0\0' as const;        //* uint8[0x7]
        /** The type of ELF file this is (e.g. executable, object file, shared library). */
        protected _type: Enums.Type = Enums.Type.None;                    //? uint16
        /** The ISA (Instruction Set Architecture) for this ELF file. This corresponds to the type of processor this ELF file is for
          * and does not necessarily include the entire specification of the ISA. isaVersion and flags may contain more information. */
        protected _isa: Enums.ISA = Enums.ISA.None;                       //? uint16
        /** The version of ISA used. The interpretation of version is ISA specific. */
        protected _isaVersion: uint32 = 0x00000000;           //! uint32
        /** The virtual address of the entry point. */
        protected _entryPoint: uint32 | uint64 = 0x00000000;  //! uint32 | uint64
        /** Offset in the ELF file of the first program header entry. */
        protected _programHeadersOffset: uint32 = 0x00000000; //! uint32
        /** Offset in the ELF file of the first section header entry. */
        protected _sectionHeadersOffset: uint32 = 0x00000000; //! uint32
        /** Flags for the ISA used. The interpretation is ISA specific. */
        protected _flags: uint32 = 0x00000000;                //! uint32
        /** The size of this ELF header in bytes. */
        readonly  headerSize: uint16 = 0x0034 as const;       //? uint16 // TODO: Unhardcode for 64-bit support
        /** The size of 1 program header entry. */
        protected _programHeadersEntrySize: uint16 = 0x0000;  //? uint16
        /** The total number of program header entries in the file. */
        protected _programHeadersEntryCount: uint16 = 0x0000; //? uint16
        /** The size of 1 section header entry. */
        protected _sectionHeadersEntrySize: uint16 = 0x0000;  //? uint16
        /** The total number of program section entries in the file. */
        protected _sectionHeadersEntryCount: uint16 = 0x0000; //? uint16
        /** The section index for the section headers string table (if any). */
        protected _shstrIndex: uint16 = 0x0000;               //? uint16
    }

    // TODO: Segments support
    //export class Segment {
    //    /** The index of this segment, as parsed. */
    //    index: number = NaN;
    //    /** The type of this segment. */
    //    type: ProgramHeaderEntryType = NaN;
    //    /** A human readable description of type. */
    //    typeDescription: string = '';
    //    /** Flags for this segment */
    //    flags: number = NaN;
    //    /** A human readable description of flags. */
    //    flagsDescription: string = '';
    //    /** The file offset for data for this segment. */
    //    offset: number = NaN;
    //    /** The virtual address for this segment. Also called the VMA address. */
    //    vaddr: number | bigint = NaN;
    //    /** The physical address for this segment. Also called the LMA or load address. */
    //    paddr: number | bigint = NaN;
    //    /** The size of this segment in the ELF file */
    //    filesz: number = NaN;
    //    /** The size of this segment in (virtual) memory. */
    //    memsz: number = NaN;
    //    /** The alignment of this segment (the segment must be loaded to an address in multiples of this). */
    //    align: number = NaN;
    //}

    export class Section {
        /** Offset from the start of the {@link Header.shstrIndex section headers string table} 
          * to the address of this section's name in said table, if any. */
        protected _nameOffset: uint32 = 0x00000000;      //! uint32
        /** The type of this section. */
        protected _type: Enums.SectionType = Enums.SectionType.Null; //! uint32
        /** The flags for this section. */
        protected _flags: uint32 = 0x00000000;           //! uint32
        /** The virtual address of this section. */
        protected _addr: uint32 | uint64 = 0x00000000;   //! uint32 | uint64
        /** The absolute offset of the section in the file. */
        protected _offset: uint32 = 0x00000000;          //! uint32
        /** The size of this section, in bytes. */
        protected _size: uint32 = 0x00000000;            //! uint32
        /** A section linked to this section. For example for a symbol section the
          * linked section is a string table section providing names for symbols. */
        protected _link: uint32 = 0x00000000;            //! uint32
        /** Section type specific info for this section. */
        protected _info: uint32 = 0x00000000;            //! uint32
        /** The alignment requirement of this section. */
        protected _addrAlign: uint32 = 0x00000000;       //! uint32
        /** The size of each "entity" in this section, if applicable.
          * For example, if this is a symbol table section, this is the size of a symbol entry. */
        protected _entSize: uint32 = 0x00000000;         //! uint32
    }

    export class Symbol {
        /** Offset from the start of the {@link Section.link linked string table section} of 
          * this symbol's section, to the address of this symbol's name in said table, if any. */
        protected _nameOffset: uint32 = 0x00000000;     //! uint32
        /** The value of this symbol. The interpretation of the value is dependent on a few things but is generally an offset or address. */
        protected _value: uint32 | uint64 = 0x00000000; //! uint32
        /** The size of this symbol, if applicable. */
        protected _size: uint32 = 0x00000000;           //! uint32
        /** Symbol type specific information. */
        protected _info: uint8 = 0x00;                  //* uint8
        /** Other symbol information. */
        protected _other: uint8 = 0x00;                 //* uint8
        /** Section index for this symbol.
          * @summary This is the index of the section for this symbol. There
          * are also special values such as 0xFFF1 for an absolute index symbol
          * in a relocatable ELF file (object file). */
        protected _shndx: uint16 = 0x0000;              //? uint16
    }

    export class Relocation {
        /** The location at which to apply the relocation action.
          * @summary This member gives the location at which to apply the relocation action. For
          * a relocatable file, the value is the byte offset from the beginning of the
          * section to the storage unit affected by the relocation. For an executable file
          * or a shared object, the value is the virtual address of the storage unit affected by the relocation. */
        protected _addr: uint32 | uint64 = 0x00000000;    //! uint32 | uint64
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
        protected _info: uint32 | uint64 = 0x00000000;    //! uint32 | uint64
        /** A constant addend used to compute the value to be stored into the relocatable field. */
        protected _addend?: sint32 | sint64 = undefined;  //? sint32 | sint64
        /** The symbol index for this relocation.
          * @summary The symbol for this relocation is found in the section identified by the
          * info field in the section this relocation is found in.
          * The symbol index is taken from the info field. */
        protected _symbolIndex: number = 0x000000;        //* 24-bit value (info >> 8)
        /** The type of this relocation.
          * @summary Relocation types are processor specific so the raw number is given here.
          * The relocation type is take from the info field */
        protected _type: uint8 = 0x00;                    //* uint8 (info & 0xFF)
    }

    /** RPL-exclusive file information section data structure. */
    export class RPLFileInfo {
        /** Magic number of the RPL_FILEINFO section, always "CAFE" */
        readonly magic = '\xCA\xFE' as const;               //? uint16
        protected _version: uint16 = 0x0000;                 //? uint16
        protected _textSize: uint32 = 0x00000000;            //* uint32
        protected _textAlign: uint32 = 0x00000000;           //* uint32
        protected _dataSize: uint32 = 0x00000000;            //* uint32
        protected _dataAlign: uint32 = 0x00000000;           //* uint32
        protected _loadSize: uint32 = 0x00000000;            //* uint32
        protected _loadAlign: uint32 = 0x00000000;           //* uint32
        protected _tempSize: uint32 = 0x00000000;            //* uint32
        protected _trampAdjust: uint32 = 0x00000000;         //* uint32
        protected _sdaBase: uint32 = 0x00000000;             //* uint32
        protected _sda2Base: uint32 = 0x00000000;            //* uint32
        protected _stackSize: uint32 = 0x00000000;           //* uint32
        /** The offset from the start of the section to the start of the strings array */
        protected _stringsOffset: uint32 = 0x00000000;       //* uint32
        protected _flags: uint32 = 0x00000000;               //* uint32
        protected _heapSize: uint32 = 0x00000000;            //* uint32
        protected _tagOffset: uint32 = 0x00000000;           //* uint32
        protected _minVersion: uint32 = 0x00000000;          //* uint32
        protected _compressionLevel: sint32 = 0x00000000;    //! sint32
        protected _trampAddition: uint32 = 0x00000000;       //* uint32
        protected _fileInfoPad: uint32 = 0x00000000;         //* uint32
        protected _cafeSdkVersion: uint32 = 0x00000000;      //* uint32
        protected _cafeSdkRevision: uint32 = 0x00000000;     //* uint32
        protected _tlsModuleIndex: uint16 = 0x0000;          //? uint16
        protected _tlsAlignShift: uint16 = 0x0000;           //? uint16
        protected _runtimeFileInfoSize: uint32 = 0x00000000; //* uint32
        /** Array of null-terminated strings until the end of the file */
        protected _strings: { [addr: number]: string; } = {};
    }
}