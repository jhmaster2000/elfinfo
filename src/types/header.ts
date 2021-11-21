import assert from 'assert';
import { uint8, uint16, uint32, uint64 } from './primitive.js';
import { Structs } from './structs.js';
import * as Enums from './enums.js';

export class Header extends Structs.Header {
    constructor() { super(); }

    /** The architecture of the ELF file, either 32 or 64 bits. */
    get class(): Enums.Class { return this._class; }
    /** The endianness of the data in the ELF file. */
    get endian(): Enums.Endian { return this._endian }
    /** The version of the ELF file. There is currently only one version. */
    get version(): Enums.Version { return this._version }
    /** The ABI (Application Binary Interface) of this ELF file. This is typically not used and set to SystemV. */
    get abi(): Enums.ABI { return this._abi }
    /** The ABI version. This is ABI specific data but is generally not used. */
    get abiVersion(): uint8 { return this._abiVersion }
    /** The type of ELF file this is (e.g. executable, object file, shared library). */
    get type(): Enums.Type { return this._type }
    /** The ISA (Instruction Set Architecture) for this ELF file. This corresponds to the type of processor this ELF file is for
      * and does not necessarily include the entire specification of the ISA. isaVersion and flags may contain more information. */
    get isa(): Enums.ISA { return this._isa }
    /** The version of ISA used. The interpretation of version is ISA specific. */
    get isaVersion(): uint32 { return this._isaVersion }
    /** The virtual address of the entry point. */
    get entryPoint(): uint32 | uint64 { return this._entryPoint }
    /** Offset in the ELF file of the first program header entry. */
    get programHeadersOffset(): uint32 { return this._programHeadersOffset }
    /** Offset in the ELF file of the first section header entry. */
    get sectionHeadersOffset(): uint32 { return this._sectionHeadersOffset }
    /** Flags for the ISA used. The interpretation is ISA specific. */
    get flags(): uint32 { return this._flags }
    /** The size of 1 program header entry. */
    get programHeadersEntrySize(): uint16 { return this._programHeadersEntrySize }
    /** The total number of program header entries in the file. */
    get programHeadersEntryCount(): uint16 { return this._programHeadersEntryCount }
    /** The size of 1 section header entry. */
    get sectionHeadersEntrySize(): uint16 { return this._sectionHeadersEntrySize }
    /** The total number of program section entries in the file. */
    get sectionHeadersEntryCount(): uint16 { return this._sectionHeadersEntryCount }
    /** The section index for the section headers string table (if any). */
    get shstrIndex(): uint16 { return this._shstrIndex }

    get bits(): 32 | 64 { return this.class === Enums.Class.ELF32 ? 32 : 64; }

    set class(_class: Enums.Class) {
        assert(_class in Enums.Class, `${_class} is not a valid ELF.Class value.`);
        this._class = _class;
    }
    set endian(endian: Enums.Endian) {
        assert(endian in Enums.Endian, `${endian} is not a valid ELF.Endian value.`);
        this._endian = endian;
    }
    set version(version: Enums.Version) {
        assert(version in Enums.Version, `${version} is not a valid ELF.Version value.`);
        this._version = version;
    }
    set abi(abi: Enums.ABI) {
        assert(abi in Enums.ABI, `${abi} is not a valid ELF.ABI value.`);
        this._abi = abi;
    }
    set abiVersion(abiVersion: uint8) {
        assert(abiVersion >= 0x00 && 0xFF >= abiVersion, `${abiVersion} does not fit inside a uint8.`);
        this._abiVersion = abiVersion;
    }
    set type(type: Enums.Type) {
        assert(type in Enums.Type, `${type} is not a valid ELF.Type value.`);
        this._type = type;
    }
    set isa(isa: Enums.ISA) {
        assert(isa in Enums.ISA, `${isa} is not a valid ELF.ISA value.`);
        this._isa = isa;
    }
    set isaVersion(isaVersion: uint32) {
        assert(isaVersion >= 0x00 && 0xFFFFFFFF >= isaVersion, `${isaVersion} does not fit inside a uint32.`);
        this._isaVersion = isaVersion;
    }
    set entryPoint(entryPoint: uint32 | uint64) {
        assert(entryPoint >= 0x00 && 0xFFFFFFFF >= entryPoint, `${entryPoint} does not fit inside a uint32.`);
        this._entryPoint = entryPoint;
    }
    set programHeadersOffset(programHeadersOffset: uint32) {
        assert(programHeadersOffset >= 0x00 && 0xFFFFFFFF >= programHeadersOffset, `${programHeadersOffset} does not fit inside a uint32.`);
        this._programHeadersOffset = programHeadersOffset;
    }
    set sectionHeadersOffset(sectionHeadersOffset: uint32) {
        assert(sectionHeadersOffset >= 0x00 && 0xFFFFFFFF >= sectionHeadersOffset, `${sectionHeadersOffset} does not fit inside a uint32.`);
        this._sectionHeadersOffset = sectionHeadersOffset;
    }
    set flags(flags: uint32) {
        assert(flags >= 0x00 && 0xFFFFFFFF >= flags, `${flags} does not fit inside a uint32.`);
        this._flags = flags;
    }
    set programHeadersEntrySize(programHeadersEntrySize: uint16) {
        assert(programHeadersEntrySize >= 0x00 && 0xFFFF >= programHeadersEntrySize, `${programHeadersEntrySize} does not fit inside a uint16.`);
        this._programHeadersEntrySize = programHeadersEntrySize;
    }
    set programHeadersEntryCount(programHeadersEntryCount: uint16) {
        assert(programHeadersEntryCount >= 0x00 && 0xFFFF >= programHeadersEntryCount, `${programHeadersEntryCount} does not fit inside a uint16.`);
        this._programHeadersEntryCount = programHeadersEntryCount;
    }
    set sectionHeadersEntrySize(sectionHeadersEntrySize: uint16) {
        assert(sectionHeadersEntrySize >= 0x00 && 0xFFFF >= sectionHeadersEntrySize, `${sectionHeadersEntrySize} does not fit inside a uint16.`);
        this._sectionHeadersEntrySize = sectionHeadersEntrySize;
    }
    set sectionHeadersEntryCount(sectionHeadersEntryCount: uint16) {
        assert(sectionHeadersEntryCount >= 0x00 && 0xFFFF >= sectionHeadersEntryCount, `${sectionHeadersEntryCount} does not fit inside a uint16.`);
        this._sectionHeadersEntryCount = sectionHeadersEntryCount;
    }
    set shstrIndex(shstrIndex: uint16) {
        assert(shstrIndex >= 0x00 && 0xFFFF >= shstrIndex, `${shstrIndex} does not fit inside a uint16.`);
        assert(shstrIndex < this.sectionHeadersEntryCount, `Section index ${shstrIndex} does not exist.`);
        this._shstrIndex = shstrIndex;
    }

    set bits(bits: 32 | 64) {
        if (!bits) this.class = Enums.Class.None;
        else if (bits === 32) this.class = Enums.Class.ELF32;
        else if (bits === 64) this.class = Enums.Class.ELF64;
        else throw new Error(`${bits} is not a valid ELF bits value.`);
    }
}
