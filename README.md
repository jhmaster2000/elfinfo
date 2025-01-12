# ELFLib
A JavaScript library to parse, edit and write ELF files.

> **Warning**
> **Archived Project**
>
> This fork of [elfinfo](https://github.com/cilliemalan/elfinfo) has been discontinued and never reached a stable stage. It is NOT usable.
>
> The primary goals of this fork were to implement writing/saving and support for Wii U RPX/RPL ELF files.
>
> For the second goal, it has been achieved by the new project [rpxlib](https://github.com/jhmaster2000/rpxlib) which was written from scratch and also does support writing/saving, however it ONLY supports Wii U RPX/RPL ELF files.
>
> If you are looking for a way to write and save generic ELF files, I'm afraid I have no solution for you here at the moment.
>
> The README past this point may be outdated or inaccurate with regards to the state of the last commit on this repository.

## Usage

```ts
import fs from 'fs/promises';
import elflib from 'elflib';

// Parse the specified ELF file
const elfdata: Buffer = await fs.readFile('./path/to/file.elf');
const elf: elflib.File = await elflib.open(elfdata);

// Do stuff with it

// Write the file back
const newdata: Buffer = await elflib.pack(elf);
await fs.writeFile('./output.elf', newdata);
```

The `open()` function above will parse the ELF file header, ~~program headers,~~ and sections. It will also read the symbol table, strings and relocations.

### Examining the data
Several functions are provided on the ELF data structure for examining information about symbols and translating addresses. For example, `getSymbolsInSection()` will get all the symbols exist in a specified section, `getSymbolFileOffset()` will tell you the actual file offset of a symbol (if possible) so you can actually read the symbol data. There are also functions for doing VMA and LMA stuff. Documentation is currently pending but autocomplete should work in an IDE like VS Code.

### BigInt and Number
Javascript numbers are doubles. This is non-ideal for 64-bit file offsets so for 64-bit ELF files BigInt is used whenever the data is stored as a 64 bit number in the ELF file or where something refers to a memory location. This can be a pain since you can't mix arithmetic for BigInt and Number.
There isn't currently a nice solution (I mean, what can you do?), so just be aware of it.

### Terminology
ELF and ELF tools (such as readelf) sometimes use conflicting terminology. Here is an indication of what
things mean according to this library:
- A **Segment** refers to a piece of data that exists in the ELF file and is to be loaded into memory at a certain location. In the ELF file they are stored as *Program Header Entries*. A segment consists mainly of a file offset and two memory locations, the virtual and physical memory locations.
- A **Section** refers to the various sections stored in the ELF file. A section has an address which is always a virtual (VMA) address. Each section mainly consists of a name, a type, a virtual memory location, and a size.
There are many kinds of sections, but the main ones are those that contain program data (either code or data), symbols, and strings. elflib currently parses string, symbol and relocation sections.
- A **Symbol** can refer to many different things, but usually refers to a *function* or *variable* used in code. There are also symbols for sections and files. Symbols are used for debugging or other analysis and do not affect program execution. Symbols are stored in symbol table sections and the names of symbols are stored in string table sections. Stored with the symbol is the name of the symbol, the type of the symbol, the virtual memory location of the symbol, sometimes the size of the symbol, and some other things.
- A **Virtual Address** refers to the address a segment, section, or symbol has in memory. This is sometimes referred to as a *VMA address* or a *memory address*.
- A **Physical Address** refers to the address a segment, section, or symbol has in non-volatile storage. This does not refer to the offset in the file. A normal ELF executable for an operating system like linux will usually have virtual addresses match the physical addresses since the file can be mapped into memory wherever needed. However, in embedded systems the data for virtual memory locations needs to be stored in flash somewhere. This is the physical address. This is also called the *LMA address* or *load address*.  Some symbols and sections don't have a physical address (for example, BSS section symbols that are cleared in memory on startup).
- A **File Offset** refers to a location in the ELF file itself.

### What gets parsed
A debug function is also provided, that spits out readelf/objdump like stuff.
```js
import fs from 'fs/promises';
import elflib from 'elflib';

// Read the ELF file
const elfdata = await fs.readFile('./file.elf');
const elf = await elflib.open(elfdata);

// Generate human-readable output
const fileinfo = elflib.debug(elf);
console.log(fileinfo);
```

This will produce the following (slightly outdated!) output. This may help you get an idea of what elflib parses at the moment:

```
Path: someelffile
Class:                             ELF64 (2)
Bits:                              64 bits
Data:                              Little endian (1)
Version:                           1
OS/ABI:                            SystemV (0x00)
ABI version:                       0
Type:                              Executable (0x02)
ISA/machine:                       x64 (0x3e)
ISA/machine version:               1
Entry Point:                       0x004003e0
Program header offset:             0x40
Section header offset:             0x18b0
Flags:                             0 (0x00)
Program headers:                   56 bytes × 9
Section headers:                   64 bytes × 27
String table section index:        26


Program Header Entries:

    #   Type                 Offset             VirtAddr           PhysAddr           FileSize           MemSiz             Align      Flags
    0   Program Header Table 0x0000000000000040 0x0000000000400040 0x0000000000400040 0x00000000000001f8 0x00000000000001f8 0x00000008 Read
    1   Interp               0x0000000000000238 0x0000000000400238 0x0000000000400238 0x000000000000001c 0x000000000000001c 0x00000001 Read
    2   Load                 0x0000000000000000 0x0000000000400000 0x0000000000400000 0x0000000000000840 0x0000000000000840 0x00200000 Read | Execute
    3   Load                 0x0000000000000e10 0x0000000000600e10 0x0000000000600e10 0x0000000000000210 0x0000000000000218 0x00200000 Read | Write
    4   Dynamic              0x0000000000000e20 0x0000000000600e20 0x0000000000600e20 0x00000000000001d0 0x00000000000001d0 0x00000008 Read | Write
    5   Note                 0x0000000000000254 0x0000000000400254 0x0000000000400254 0x0000000000000020 0x0000000000000020 0x00000004 Read
    6   GNU EH frame         0x00000000000006bc 0x00000000004006bc 0x00000000004006bc 0x000000000000004c 0x000000000000004c 0x00000004 Read
    7   GNU stack info       0x0000000000000000 0x0000000000000000 0x0000000000000000 0x0000000000000000 0x0000000000000000 0x00000010 Read | Write
    8   GNU ro relocation    0x0000000000000e10 0x0000000000600e10 0x0000000000600e10 0x00000000000001f0 0x00000000000001f0 0x00000001 Read


Sections:

    #   Name               Type                             Address            Offset             Size               EntSize            Link  Info  Align      Flags
    0   <null>             NULL section                     0x0000000000000000 0x0000000000000000 0x0000000000000000 0x0000000000000000             0x00000000 <none>
    1   .interp            Prog bits                        0x0000000000400238 0x0000000000000238 0x000000000000001c 0x0000000000000000             0x00000001 Alloc
    2   .note.ABI-tag      Note                             0x0000000000400254 0x0000000000000254 0x0000000000000020 0x0000000000000000             0x00000004 Alloc
    3   .gnu.hash          GNU hash section                 0x0000000000400278 0x0000000000000278 0x000000000000001c 0x0000000000000000    4        0x00000008 Alloc
    4   .dynsym            Dynamic linking symbols section  0x0000000000400298 0x0000000000000298 0x0000000000000060 0x0000000000000018    5     1  0x00000008 Alloc
    5   .dynstr            String table                     0x00000000004002f8 0x00000000000002f8 0x000000000000003f 0x0000000000000000             0x00000001 Alloc
    6   .gnu.version       GNU version symbol table         0x0000000000400338 0x0000000000000338 0x0000000000000008 0x0000000000000002    4        0x00000002 Alloc
    7   .gnu.version_r     GNU version needs section        0x0000000000400340 0x0000000000000340 0x0000000000000020 0x0000000000000000    5     1  0x00000008 Alloc
    8   .rela.dyn          Relocation section with addends  0x0000000000400360 0x0000000000000360 0x0000000000000030 0x0000000000000018    4        0x00000008 Alloc
    9   .rela.plt          Relocation section with addends  0x0000000000400390 0x0000000000000390 0x0000000000000018 0x0000000000000018    4    21  0x00000008 Alloc | Info Link
    10  .init              Prog bits                        0x00000000004003a8 0x00000000000003a8 0x0000000000000017 0x0000000000000000             0x00000004 Alloc | Executable
    11  .plt               Prog bits                        0x00000000004003c0 0x00000000000003c0 0x0000000000000020 0x0000000000000010             0x00000010 Alloc | Executable
    12  .text              Prog bits                        0x00000000004003e0 0x00000000000003e0 0x0000000000000292 0x0000000000000000             0x00000010 Alloc | Executable
    13  .fini              Prog bits                        0x0000000000400674 0x0000000000000674 0x0000000000000009 0x0000000000000000             0x00000004 Alloc | Executable
    14  .rodata            Prog bits                        0x0000000000400680 0x0000000000000680 0x000000000000003a 0x0000000000000000             0x00000004 Alloc
    15  .eh_frame_hdr      Prog bits                        0x00000000004006bc 0x00000000000006bc 0x000000000000004c 0x0000000000000000             0x00000004 Alloc
    16  .eh_frame          Prog bits                        0x0000000000400708 0x0000000000000708 0x0000000000000138 0x0000000000000000             0x00000008 Alloc
    17  .init_array        Init array                       0x0000000000600e10 0x0000000000000e10 0x0000000000000008 0x0000000000000008             0x00000008 Writeable | Alloc
    18  .fini_array        Fini array                       0x0000000000600e18 0x0000000000000e18 0x0000000000000008 0x0000000000000008             0x00000008 Writeable | Alloc
    19  .dynamic           Dynamic                          0x0000000000600e20 0x0000000000000e20 0x00000000000001d0 0x0000000000000010    5        0x00000008 Writeable | Alloc
    20  .got               Prog bits                        0x0000000000600ff0 0x0000000000000ff0 0x0000000000000010 0x0000000000000008             0x00000008 Writeable | Alloc
    21  .got.plt           Prog bits                        0x0000000000601000 0x0000000000001000 0x0000000000000020 0x0000000000000008             0x00000008 Writeable | Alloc
    22  .bss               No bits                          0x0000000000601020 0x0000000000001020 0x0000000000000008 0x0000000000000000             0x00000001 Writeable | Alloc
    23  .comment           Prog bits                        0x0000000000000000 0x0000000000001020 0x000000000000005f 0x0000000000000001             0x00000001 Merge | Strings
    24  .symtab            Symbol table                     0x0000000000000000 0x0000000000001080 0x0000000000000570 0x0000000000000018   25    42  0x00000008 <none>
    25  .strtab            String table                     0x0000000000000000 0x00000000000015f0 0x00000000000001d1 0x0000000000000000             0x00000001 <none>
    26  .shstrtab          String table                     0x0000000000000000 0x00000000000017c1 0x00000000000000ea 0x0000000000000000             0x00000001 <none>


Symbols for section #4 .dynsym:

    #   Value              Size       Type                         Bind   Visibility Name
        0 0x0000000000000000 0x00000000 None                         Local  Default
        1 0x0000000000000000 0x00000000 Function                     Global Default    printf
        2 0x0000000000000000 0x00000000 Function                     Global Default    __libc_start_main
        3 0x0000000000000000 0x00000000 None                         Weak   Default    __gmon_start__


Symbols for section #24 .symtab:

    #   Value              Size       Type                         Bind   Visibility Name
        0 0x0000000000000000 0x00000000 None                         Local  Default
        1 0x0000000000400238 0x00000000 Section                      Local  Default
        2 0x0000000000400254 0x00000000 Section                      Local  Default
        3 0x0000000000400278 0x00000000 Section                      Local  Default
        4 0x0000000000400298 0x00000000 Section                      Local  Default
        5 0x00000000004002f8 0x00000000 Section                      Local  Default
        6 0x0000000000400338 0x00000000 Section                      Local  Default
        7 0x0000000000400340 0x00000000 Section                      Local  Default
        8 0x0000000000400360 0x00000000 Section                      Local  Default
        9 0x0000000000400390 0x00000000 Section                      Local  Default
        10 0x00000000004003a8 0x00000000 Section                      Local  Default
        11 0x00000000004003c0 0x00000000 Section                      Local  Default
        12 0x00000000004003e0 0x00000000 Section                      Local  Default
        13 0x0000000000400674 0x00000000 Section                      Local  Default
        14 0x0000000000400680 0x00000000 Section                      Local  Default
        15 0x00000000004006bc 0x00000000 Section                      Local  Default
        16 0x0000000000400708 0x00000000 Section                      Local  Default
        17 0x0000000000600e10 0x00000000 Section                      Local  Default
        18 0x0000000000600e18 0x00000000 Section                      Local  Default
        19 0x0000000000600e20 0x00000000 Section                      Local  Default
        20 0x0000000000600ff0 0x00000000 Section                      Local  Default
        21 0x0000000000601000 0x00000000 Section                      Local  Default
        22 0x0000000000601020 0x00000000 Section                      Local  Default
        23 0x0000000000000000 0x00000000 Section                      Local  Default
        24 0x0000000000000000 0x00000000 File                         Local  Default    crtstuff.c
        25 0x0000000000400420 0x00000000 Function                     Local  Default    deregister_tm_clones
        26 0x0000000000400450 0x00000000 Function                     Local  Default    register_tm_clones
        27 0x0000000000400490 0x00000000 Function                     Local  Default    __do_global_dtors_aux
        28 0x0000000000601020 0x00000001 Object                       Local  Default    completed.7698
        29 0x0000000000600e18 0x00000000 Object                       Local  Default    __do_global_dtors_aux_fini_array_entry
        30 0x00000000004004c0 0x00000000 Function                     Local  Default    frame_dummy
        31 0x0000000000600e10 0x00000000 Object                       Local  Default    __frame_dummy_init_array_entry
        32 0x0000000000000000 0x00000000 File                         Local  Default    factorial.cpp
        33 0x0000000000000000 0x00000000 File                         Local  Default    main.cpp
        34 0x0000000000000000 0x00000000 File                         Local  Default    crtstuff.c
        35 0x000000000040083c 0x00000000 Object                       Local  Default    __FRAME_END__
        36 0x0000000000000000 0x00000000 File                         Local  Default
        37 0x0000000000600e18 0x00000000 None                         Local  Default    __init_array_end
        38 0x0000000000600e20 0x00000000 Object                       Local  Default    _DYNAMIC
        39 0x0000000000600e10 0x00000000 None                         Local  Default    __init_array_start
        40 0x00000000004006bc 0x00000000 None                         Local  Default    __GNU_EH_FRAME_HDR
        41 0x0000000000601000 0x00000000 Object                       Local  Default    _GLOBAL_OFFSET_TABLE_
        42 0x0000000000400670 0x00000002 Function                     Global Default    __libc_csu_fini
        43 0x0000000000601020 0x00000000 None                         Global Default    _edata
        44 0x0000000000400674 0x00000000 Function                     Global Default    _fini
        45 0x0000000000000000 0x00000000 Function                     Global Default    printf@@GLIBC_2.2.5
        46 0x0000000000000000 0x00000000 Function                     Global Default    __libc_start_main@@GLIBC_2.2.5
        47 0x0000000000400510 0x00000072 Function                     Global Default    _Z10factorialff
        48 0x00000000004004d0 0x0000003e Function                     Global Default    _Z10factorialii
        49 0x0000000000000000 0x00000000 None                         Weak   Default    __gmon_start__
        50 0x0000000000400600 0x00000065 Function                     Global Default    __libc_csu_init
        51 0x0000000000601028 0x00000000 None                         Global Default    _end
        52 0x0000000000400410 0x00000002 Function                     Global Hidden     _dl_relocate_static_pie
        53 0x00000000004003e0 0x0000002b Function                     Global Default    _start
        54 0x0000000000601020 0x00000000 None                         Global Default    __bss_start
        55 0x0000000000400590 0x0000006f Function                     Global Default    main
        56 0x0000000000601020 0x00000000 Object                       Global Hidden     __TMC_END__
        57 0x00000000004003a8 0x00000000 Function                     Global Default    _init
```

* * *

# Testing
In order to run tests you will need to have the following programs installed and in your `PATH`:
- [gcc](https://gcc.gnu.org/)
- [clang](https://releases.llvm.org/download.html#10.0.0)
- [arm-eabi-gcc](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads)
- [arm-aarch32-gcc](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-a/downloads)
- [arm-aarch64-gcc](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-a/downloads)
- [arm-aarch64_be-gcc](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-a/downloads)
- [riscv-embedded-gcc](https://github.com/xpack-dev-tools/riscv-none-embed-gcc-xpack/releases/)
- [xtensa-gcc](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/tools/idf-tools.html#xtensa-esp32-elf)

And then build the test programs by running `testprograms/build.sh`.

*Note:* just because the programs compile doesn't mean they will work or represent how one should write programs for any of the given platforms. The idea is to generate executables for tests and the tests don't run the programs, they just expect the ELF files to contain certain things.

# Roadmap

**Done:**
- [x] Read elf file, including ~~segments and~~ sections.
- [x] Read symbols, relocations and string tables and relate them to sections.
- [x] Provide functions for dealing with addresses (VMA, LMA, and file).
- [x] Write parsed elf back to file. (Experimental)
- [x] Support for PowerPC RPL/RPX files.
- [x] Compression and decompression with Zlib.

**TODO:**
- [ ] **Reimplement segments and 64 bit support.**
- [ ] Async file API.
- [ ] Documentation.
- [ ] Disassembly of functions.
- [ ] Rudimentary binary analysis, especially stack analysis.
- [ ] Demangling of C++ names (or other names for that matter).
- [ ] Performance. Though the ELF parsing happens in an instant, the functions for inspecting the structure are slow and will suffer on big files.
- [ ] Test on more platforms. Currently we do cursory checks for x64, Risc-V, PowerPC and ARM Cortex-M. Other platforms of interest could be MIPS, etc. executables for these systems should load but no tests have been done.
- [ ] A companion library for visualization. I would like to see where everything is and easily be able to spot functions that are too big or in the wrong place.

# License
See [LICENSE](LICENSE) which applies to all files in this repository unless otherwise specified.
