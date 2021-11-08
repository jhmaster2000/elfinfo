/** The architecture of the ELF file, either 32 or 64 bits. //* uint8 */
export enum Class {
    None  = 0x00,
    ELF32 = 0x01,
    ELF64 = 0x02
}

/** The endianness of the data in the ELF file. //* uint8 */
export enum Endian {
    None   = 0x00,
    Little = 0x01,
    Big    = 0x02
}

/** The version of the ELF file. There is currently only one version. //* uint8 */
export enum Version {
    None    = 0x00,
    Current = 0x01
}

/** The type of Application Binary Interface. //* uint8 */
export enum ABI {
    SystemV        = 0x00,
    HPUX           = 0x01,
    NetBSD         = 0x02,
    Linux          = 0x03,
    GNUHurd        = 0x04,
    Solaris        = 0x06,
    AIX            = 0x07,
    IRIX           = 0x08,
    FreeBSD        = 0x09,
    Tru64          = 0x0A,
    NovelloModesto = 0x0B,
    OpenBSD        = 0x0C,
    OpenVMS        = 0x0D,
    NonStopKernel  = 0x0E,
    AROS           = 0x0F,
    FenixOS        = 0x10,
    CloudABI       = 0x11,
    ARMEABI        = 0x40,
    ARM            = 0x61,
    CafeOS         = 0xCA,
    Standalone     = 0xFF
}

/** The type of ELF file. Executables are ELF files, while some other files (like .o or .so files)
  * are also ELF files but of different types. //? uint16 */
export enum Type {
    None        = 0x0000,
    Relocatable = 0x0001,
    Executable  = 0x0002,
    Shared      = 0x0003,
    Core        = 0x0004,
    RPL         = 0xFE01
}

/** The type of Instruction Set Architecture. //? uint16 */
export enum ISA {
    None          = 0x0000,
    M32           = 0x0001,
    SPARC         = 0x0002,
    x86           = 0x0003,
    ISA68K        = 0x0004,
    ISA88K        = 0x0005,
    IAMCU         = 0x0006,
    ISA860        = 0x0007,
    MIPS          = 0x0008,
    S370          = 0x0009,
    MIPS_RS3_LE   = 0x000A,
    PARISC        = 0x000F,
    VPP500        = 0x0011,
    SPARC32PLUS   = 0x0012,
    ISA960        = 0x0013,
    PPC           = 0x0014,
    PPC64         = 0x0015,
    S390          = 0x0016,
    SPU           = 0x0017,
    V800          = 0x0024,
    FR20          = 0x0025,
    RH32          = 0x0026,
    RCE           = 0x0027,
    ARM           = 0x0028,
    FAKE_ALPHA    = 0x0029,
    SH            = 0x002A,
    SPARCV9       = 0x002B,
    TRICORE       = 0x002C,
    ARC           = 0x002D,
    H8_300        = 0x002E,
    H8_300H       = 0x002F,
    H8S           = 0x0030,
    H8_500        = 0x0031,
    IA_64         = 0x0032,
    MIPS_X        = 0x0033,
    COLDFIRE      = 0x0034,
    ISA68HC12     = 0x0035,
    MMA           = 0x0036,
    PCP           = 0x0037,
    NCPU          = 0x0038,
    NDR1          = 0x0039,
    STARCORE      = 0x003A,
    ME16          = 0x003B,
    ST100         = 0x003C,
    TINYJ         = 0x003D,
    X86_64        = 0x003E,
    PDSP          = 0x003F,
    PDP10         = 0x0040,
    PDP11         = 0x0041,
    FX66          = 0x0042,
    ST9PLUS       = 0x0043,
    ST7           = 0x0044,
    ISA68HC16     = 0x0045,
    ISA68HC11     = 0x0046,
    ISA68HC08     = 0x0047,
    ISA68HC05     = 0x0048,
    SVX           = 0x0049,
    ST19          = 0x004A,
    VAX           = 0x004B,
    CRIS          = 0x004C,
    JAVELIN       = 0x004D,
    FIREPATH      = 0x004E,
    ZSP           = 0x004F,
    MMIX          = 0x0050,
    HUANY         = 0x0051,
    PRISM         = 0x0052,
    AVR           = 0x0053,
    FR30          = 0x0054,
    D10V          = 0x0055,
    D30V          = 0x0056,
    V850          = 0x0057,
    M32R          = 0x0058,
    MN10300       = 0x0059,
    MN10200       = 0x005A,
    PJ            = 0x005B,
    OPENRISC      = 0x005C,
    ARC_COMPACT   = 0x005D,
    XTENSA        = 0x005E,
    VIDEOCORE     = 0x005F,
    TMM_GPP       = 0x0060,
    NS32K         = 0x0061,
    TPC           = 0x0062,
    SNP1K         = 0x0063,
    ST200         = 0x0064,
    IP2K          = 0x0065,
    MAX           = 0x0066,
    CR            = 0x0067,
    F2MC16        = 0x0068,
    MSP430        = 0x0069,
    BLACKFIN      = 0x006A,
    SE_C33        = 0x006B,
    SEP           = 0x006C,
    ARCA          = 0x006D,
    UNICORE       = 0x006E,
    EXCESS        = 0x006F,
    DXP           = 0x0070,
    ALTERA_NIOS2  = 0x0071,
    CRX           = 0x0072,
    XGATE         = 0x0073,
    C166          = 0x0074,
    M16C          = 0x0075,
    DSPIC30F      = 0x0076,
    CE            = 0x0077,
    M32C          = 0x0078,
    TSK3000       = 0x0083,
    RS08          = 0x0084,
    SHARC         = 0x0085,
    ECOG2         = 0x0086,
    SCORE7        = 0x0087,
    DSP24         = 0x0088,
    VIDEOCORE3    = 0x0089,
    LATTICEMICO32 = 0x008A,
    SE_C17        = 0x008B,
    TI_C6000      = 0x008C,
    TI_C2000      = 0x008D,
    TI_C5500      = 0x008E,
    TI_ARP32      = 0x008F,
    TI_PRU        = 0x0090,
    MMDSP_PLUS    = 0x00A0,
    CYPRESS_M8C   = 0x00A1,
    R32C          = 0x00A2,
    TRIMEDIA      = 0x00A3,
    QDSP6         = 0x00A4,
    ISA8051       = 0x00A5,
    STXP7X        = 0x00A6,
    NDS32         = 0x00A7,
    ECOG1X        = 0x00A8,
    MAXQ30        = 0x00A9,
    XIMO16        = 0x00AA,
    MANIK         = 0x00AB,
    CRAYNV2       = 0x00AC,
    RX            = 0x00AD,
    METAG         = 0x00AE,
    MCST_ELBRUS   = 0x00AF,
    ECOG16        = 0x00B0,
    CR16          = 0x00B1,
    ETPU          = 0x00B2,
    SLE9X         = 0x00B3,
    L10M          = 0x00B4,
    K10M          = 0x00B5,
    AARCH64       = 0x00B7,
    AVR32         = 0x00B9,
    STM8          = 0x00BA,
    TILE64        = 0x00BB,
    TILEPRO       = 0x00BC,
    MICROBLAZE    = 0x00BD,
    CUDA          = 0x00BE,
    TILEGX        = 0x00BF,
    CLOUDSHIELD   = 0x00C0,
    COREA_1ST     = 0x00C1,
    COREA_2ND     = 0x00C2,
    ARC_COMPACT2  = 0x00C3,
    OPEN8         = 0x00C4,
    RL78          = 0x00C5,
    VIDEOCORE5    = 0x00C6,
    ISA78KOR      = 0x00C7,
    ISA56800EX    = 0x00C8,
    BA1           = 0x00C9,
    BA2           = 0x00CA,
    XCORE         = 0x00CB,
    MCHP_PIC      = 0x00CC,
    KM32          = 0x00D2,
    KMX32         = 0x00D3,
    EMX16         = 0x00D4,
    EMX8          = 0x00D5,
    KVARC         = 0x00D6,
    CDP           = 0x00D7,
    COGE          = 0x00D8,
    COOL          = 0x00D9,
    NORC          = 0x00DA,
    CSR_KALIMBA   = 0x00DB,
    Z80           = 0x00DC,
    VISIUM        = 0x00DD,
    FT32          = 0x00DE,
    MOXIE         = 0x00DF,
    AMDGPU        = 0x00E0,
    RISCV         = 0x00F3,
    BPF           = 0x00F7,
    CSKY          = 0x00FC
}

/** The type of a segment (program header entry). //! uint32 */
export enum SegmentType {
    Null            = 0x00000000,
    Load            = 0x00000001,
    Dynamic         = 0x00000002,
    Interp          = 0x00000003,
    Note            = 0x00000004,
    ShLib           = 0x00000005,
    ProgHeaderTable = 0x00000006,
    GnuEhFrame      = 0x6474E550,
    GnuStack        = 0x6474E551,
    GnuRelRo        = 0x6474E552
}

/** The type of section (section header entry). //! uint32 */
export enum SectionType {
    /** Inactive section with undefined values (SHT_NULL) */
    Null          = 0x00000000,
    /** Information defined by the program, includes executable code and data (SHT_PROGBITS) */
    ProgBits      = 0x00000001,
    /** Section data contains a symbol table (SHT_SYMTAB) */
    SymTab        = 0x00000002,
    /** Section data contains a string table (SHT_STRTAB) */
    StrTab        = 0x00000003,
    /** Section data contains relocation entries with explicit addends (SHT_RELA) */
    Rela          = 0x00000004,
    /** Section data contains a symbol hash table. Must be present for dynamic linking (SHT_HASH) */
    Hash          = 0x00000005,
    /** Section data contains information for dynamic linking (SHT_DYNAMIC) */
    Dynamic       = 0x00000006,
    /** Section data contains information that marks the file in some way (SHT_NOTE) */
    Note          = 0x00000007,
    /** Section data occupies no space in the file but otherwise resembles SHT_PROGBITS (SHT_NOBITS) */
    NoBits        = 0x00000008,
    /** Section data contains relocation entries without explicit addends (SHT_REL) */
    Rel           = 0x00000009,
    /** Section is reserved but has unspecified semantics (SHT_SHLIB) */
    ShLib         = 0x0000000A,
    /** Section data contains a minimal set of dynamic linking symbols (SHT_DYNSYM) */
    DynSym        = 0x0000000B,
    /** Section data contains an array of constructors (SHT_INIT_ARRAY) */
    InitArray     = 0x0000000E,
    /** Section data contains an array of destructors (SHT_FINI_ARRAY) */
    FiniArray     = 0x0000000F,
    /** Section data contains an array of pre-constructors (SHT_PREINIT_ARRAY) */
    PreInitArray  = 0x00000010,
    /** Section group (SHT_GROUP) */
    Group         = 0x00000011,
    /** Extended symbol table section index (SHT_SYMTAB_SHNDX) */
    ShNdx         = 0x00000012,
    /** Number of reserved SHT_* values (SHT_NUM) */
    Num           = 0x00000013,
    /** Object attributes (SHT_GNU_ATTRIBUTES) */
    GnuAttributes = 0x6FFFFFF5,
    /** GNU-style hash section (SHT_GNU_HASH) */
    GnuHash       = 0x6FFFFFF6,
    /** Pre-link library list (SHT_GNU_LIBLIST) */
    GnuLibList    = 0x6FFFFFF7,
    /** Version definition section (SHT_GNU_verdef) */
    GnuVerDef     = 0x6FFFFFFD,
    /** Version needs section (SHT_GNU_verdneed) */
    GnuVerNeed    = 0x6FFFFFFE,
    /** Version symbol table (SHT_GNU_versym) */
    GnuVerSym     = 0x6FFFFFFF,
    /** RPL exports table (SHT_RPL_EXPORTS) */
    RPLExports    = 0x80000001,
    /** RPL imports table (SHT_RPL_IMPORTS) */
    RPLImports    = 0x80000002,
    /** RPL file CRC hashes (SHT_RPL_CRCS) */
    RPLCrcs       = 0x80000003,
    /** RPL file information (SHT_RPL_FILEINFO) */
    RPLFileInfo   = 0x80000004
}

/** Section header flags //! uint32 */
export enum SectionFlags {
    None            = 0x00000000,
    /** (SHF_WRITE) */
    Write           = 0x00000001,
    /** (SHF_ALLOC) */
    Alloc           = 0x00000002,
    /** (SHF_EXECINSTR) */
    Executable      = 0x00000004,
    /** (SHF_MERGE) */
    Merge           = 0x00000010,
    /** (SHF_STRINGS) */
    Strings         = 0x00000020,
    /** (SHF_INFO_LINK) */
    InfoLink        = 0x00000040,
    /** (SHF_LINK_ORDER) */
    LinkOrder       = 0x00000080,
    /** (SHF_OS_NONCONFORMING) */
    Nonconforming   = 0x00000100,
    /** (SHF_GROUP) */
    Group           = 0x00000200,
    /** (SHF_TLS) */
    TLS             = 0x00000400,
    /** (SHF_COMPRESSED) */
    Compressed      = 0x08000000,
    /** (SHF_AMD64_LARGE) */
    AMD64Large      = 0x10000000,
    /** (SHF_ORDERED) */
    Ordered         = 0x40000000,
    /** (SHF_EXCLUDE) */
    Exclude         = 0x80000000
}

/** The scope of the symbol. //* nybble */
export enum SymbolBinding {
    /** A local symbol is akin to a local variable. */
    Local  = 0x00 >> 4,
    /** A global symbol is akin to a global variable or function. */
    Global = 0x10 >> 4,
    /** A weak symbol is a symbol that can be replaced by a non-weak symbol in another object file when linking. */
    Weak   = 0x20 >> 4
}

/** The type of symbol. The most common symbol is a function or object,
  * but other kinds of symbols exist for keeping track of various things. //* nybble */
export enum SymbolType {
    None                       = 0x00 & 0xF,
    Object                     = 0x01 & 0xF,
    Function                   = 0x02 & 0xF,
    Section                    = 0x03 & 0xF,
    File                       = 0x04 & 0xF,
    Common                     = 0x05 & 0xF,
    ThreadLocalStorage         = 0x06 & 0xF,
    RelocationExpression       = 0x07 & 0xF,
    SignedRelocationExpression = 0x08 & 0xF
}

/** The visibility of a symbol. //* uint8 */
export enum SymbolVisibility {
    Default   = 0x00 & 0x3,
    Internal  = 0x01 & 0x3,
    Hidden    = 0x02 & 0x3,
    Protected = 0x03 & 0x3
}
