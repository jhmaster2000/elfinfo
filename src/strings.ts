import * as ELF from './types';

export function isaToString(isa: ELF.ISA): string {
    switch (isa) {
        case ELF.ISA.None:          return 'No machine';
        case ELF.ISA.M32:           return 'AT&T WE 32100';
        case ELF.ISA.SPARC:         return 'SUN SPARC';
        case ELF.ISA.x86:           return 'Intel x86';
        case ELF.ISA.ISA68K:        return 'Motorola m68k family';
        case ELF.ISA.ISA88K:        return 'Motorola m88k family';
        case ELF.ISA.IAMCU:         return 'Intel MCU';
        case ELF.ISA.ISA860:        return 'Intel 80860';
        case ELF.ISA.MIPS:          return 'MIPS R3000 big-endian';
        case ELF.ISA.S370:          return 'IBM System/370';
        case ELF.ISA.MIPS_RS3_LE:   return 'MIPS R3000 little-endian';
        case ELF.ISA.PARISC:        return 'HPPA';
        case ELF.ISA.VPP500:        return 'Fujitsu VPP500';
        case ELF.ISA.SPARC32PLUS:   return 'Sun\'s "v8plus"';
        case ELF.ISA.ISA960:        return 'Intel 80960';
        case ELF.ISA.PPC:           return 'PowerPC';
        case ELF.ISA.PPC64:         return 'PowerPC 64-bit';
        case ELF.ISA.S390:          return 'IBM S390';
        case ELF.ISA.SPU:           return 'IBM SPU/SPC';
        case ELF.ISA.V800:          return 'NEC V800 series';
        case ELF.ISA.FR20:          return 'Fujitsu FR20';
        case ELF.ISA.RH32:          return 'TRW RH-32';
        case ELF.ISA.RCE:           return 'Motorola RCE';
        case ELF.ISA.ARM:           return 'ARM';
        case ELF.ISA.FAKE_ALPHA:    return 'Digital Alpha';
        case ELF.ISA.SH:            return 'Hitachi SH';
        case ELF.ISA.SPARCV9:       return 'SPARC v9 64-bit';
        case ELF.ISA.TRICORE:       return 'Siemens Tricore';
        case ELF.ISA.ARC:           return 'Argonaut RISC Core';
        case ELF.ISA.H8_300:        return 'Hitachi H8/300';
        case ELF.ISA.H8_300H:       return 'Hitachi H8/300H';
        case ELF.ISA.H8S:           return 'Hitachi H8S';
        case ELF.ISA.H8_500:        return 'Hitachi H8/500';
        case ELF.ISA.IA_64:         return 'Intel Merced';
        case ELF.ISA.MIPS_X:        return 'Stanford MIPS-X';
        case ELF.ISA.COLDFIRE:      return 'Motorola Coldfire';
        case ELF.ISA.ISA68HC12:     return 'Motorola M68HC12';
        case ELF.ISA.MMA:           return 'Fujitsu MMA Multimedia Accelerator';
        case ELF.ISA.PCP:           return 'Siemens PCP';
        case ELF.ISA.NCPU:          return 'Sony nCPU embeeded RISC';
        case ELF.ISA.NDR1:          return 'Denso NDR1 microprocessor';
        case ELF.ISA.STARCORE:      return 'Motorola Start*Core processor';
        case ELF.ISA.ME16:          return 'Toyota ME16 processor';
        case ELF.ISA.ST100:         return 'STMicroelectronic ST100 processor';
        case ELF.ISA.TINYJ:         return 'Advanced Logic Corp. Tinyj emb.fam';
        case ELF.ISA.X86_64:        return 'AMD x86-64 architecture';
        case ELF.ISA.PDSP:          return 'Sony DSP Processor';
        case ELF.ISA.PDP10:         return 'Digital PDP-10';
        case ELF.ISA.PDP11:         return 'Digital PDP-11';
        case ELF.ISA.FX66:          return 'Siemens FX66 microcontroller';
        case ELF.ISA.ST9PLUS:       return 'STMicroelectronics ST9+ 8/16 mc';
        case ELF.ISA.ST7:           return 'STmicroelectronics ST7 8 bit mc';
        case ELF.ISA.ISA68HC16:     return 'Motorola MC68HC16 microcontroller';
        case ELF.ISA.ISA68HC11:     return 'Motorola MC68HC11 microcontroller';
        case ELF.ISA.ISA68HC08:     return 'Motorola MC68HC08 microcontroller';
        case ELF.ISA.ISA68HC05:     return 'Motorola MC68HC05 microcontroller';
        case ELF.ISA.SVX:           return 'Silicon Graphics SVx';
        case ELF.ISA.ST19:          return 'STMicroelectronics ST19 8 bit mc';
        case ELF.ISA.VAX:           return 'Digital VAX';
        case ELF.ISA.CRIS:          return 'Axis Communications 32-bit emb.proc';
        case ELF.ISA.JAVELIN:       return 'Infineon Technologies 32-bit emb.proc';
        case ELF.ISA.FIREPATH:      return 'Element 14 64-bit DSP Processor';
        case ELF.ISA.ZSP:           return 'LSI Logic 16-bit DSP Processor';
        case ELF.ISA.MMIX:          return 'Donald Knuth\'s educational 64-bit proc';
        case ELF.ISA.HUANY:         return 'Harvard University machine-independent object files';
        case ELF.ISA.PRISM:         return 'SiTera Prism';
        case ELF.ISA.AVR:           return 'Atmel AVR 8-bit microcontroller';
        case ELF.ISA.FR30:          return 'Fujitsu FR30';
        case ELF.ISA.D10V:          return 'Mitsubishi D10V';
        case ELF.ISA.D30V:          return 'Mitsubishi D30V';
        case ELF.ISA.V850:          return 'NEC v850';
        case ELF.ISA.M32R:          return 'Mitsubishi M32R';
        case ELF.ISA.MN10300:       return 'Matsushita MN10300';
        case ELF.ISA.MN10200:       return 'Matsushita MN10200';
        case ELF.ISA.PJ:            return 'picoJava';
        case ELF.ISA.OPENRISC:      return 'OpenRISC 32-bit embedded processor';
        case ELF.ISA.ARC_COMPACT:   return 'ARC International ARCompact';
        case ELF.ISA.XTENSA:        return 'Tensilica Xtensa Architecture';
        case ELF.ISA.VIDEOCORE:     return 'Alphamosaic VideoCore';
        case ELF.ISA.TMM_GPP:       return 'Thompson Multimedia General Purpose Proc';
        case ELF.ISA.NS32K:         return 'National Semi. 32000';
        case ELF.ISA.TPC:           return 'Tenor Network TPC';
        case ELF.ISA.SNP1K:         return 'Trebia SNP 1000';
        case ELF.ISA.ST200:         return 'STMicroelectronics ST200';
        case ELF.ISA.IP2K:          return 'Ubicom IP2xxx';
        case ELF.ISA.MAX:           return 'MAX processor';
        case ELF.ISA.CR:            return 'National Semi. CompactRISC';
        case ELF.ISA.F2MC16:        return 'Fujitsu F2MC16';
        case ELF.ISA.MSP430:        return 'Texas Instruments msp430';
        case ELF.ISA.BLACKFIN:      return 'Analog Devices Blackfin DSP';
        case ELF.ISA.SE_C33:        return 'Seiko Epson S1C33 family';
        case ELF.ISA.SEP:           return 'Sharp embedded microprocessor';
        case ELF.ISA.ARCA:          return 'Arca RISC';
        case ELF.ISA.UNICORE:       return 'PKU-Unity & MPRC Peking Uni. mc series';
        case ELF.ISA.EXCESS:        return 'eXcess configurable cpu';
        case ELF.ISA.DXP:           return 'Icera Semi. Deep Execution Processor';
        case ELF.ISA.ALTERA_NIOS2:  return 'Altera Nios II';
        case ELF.ISA.CRX:           return 'National Semi. CompactRISC CRX';
        case ELF.ISA.XGATE:         return 'Motorola XGATE';
        case ELF.ISA.C166:          return 'Infineon C16x/XC16x';
        case ELF.ISA.M16C:          return 'Renesas M16C';
        case ELF.ISA.DSPIC30F:      return 'Microchip Technology dsPIC30F';
        case ELF.ISA.CE:            return 'Freescale Communication Engine RISC';
        case ELF.ISA.M32C:          return 'Renesas M32C';
        case ELF.ISA.TSK3000:       return 'Altium TSK3000';
        case ELF.ISA.RS08:          return 'Freescale RS08';
        case ELF.ISA.SHARC:         return 'Analog Devices SHARC family';
        case ELF.ISA.ECOG2:         return 'Cyan Technology eCOG2';
        case ELF.ISA.SCORE7:        return 'Sunplus S+core7 RISC';
        case ELF.ISA.DSP24:         return 'New Japan Radio (NJR) 24-bit DSP';
        case ELF.ISA.VIDEOCORE3:    return 'Broadcom VideoCore III';
        case ELF.ISA.LATTICEMICO32: return 'RISC for Lattice FPGA';
        case ELF.ISA.SE_C17:        return 'Seiko Epson C17';
        case ELF.ISA.TI_C6000:      return 'Texas Instruments TMS320C6000 DSP';
        case ELF.ISA.TI_C2000:      return 'Texas Instruments TMS320C2000 DSP';
        case ELF.ISA.TI_C5500:      return 'Texas Instruments TMS320C55x DSP';
        case ELF.ISA.TI_ARP32:      return 'Texas Instruments App. Specific RISC';
        case ELF.ISA.TI_PRU:        return 'Texas Instruments Prog. Realtime Unit';
        case ELF.ISA.MMDSP_PLUS:    return 'STMicroelectronics 64bit VLIW DSP';
        case ELF.ISA.CYPRESS_M8C:   return 'Cypress M8C';
        case ELF.ISA.R32C:          return 'Renesas R32C';
        case ELF.ISA.TRIMEDIA:      return 'NXP Semi. TriMedia';
        case ELF.ISA.QDSP6:         return 'QUALCOMM DSP6';
        case ELF.ISA.ISA8051:       return 'Intel 8051 and variants';
        case ELF.ISA.STXP7X:        return 'STMicroelectronics STxP7x';
        case ELF.ISA.NDS32:         return 'Andes Tech. compact code emb. RISC';
        case ELF.ISA.ECOG1X:        return 'Cyan Technology eCOG1X';
        case ELF.ISA.MAXQ30:        return 'Dallas Semi. MAXQ30 mc';
        case ELF.ISA.XIMO16:        return 'New Japan Radio (NJR) 16-bit DSP';
        case ELF.ISA.MANIK:         return 'M2000 Reconfigurable RISC';
        case ELF.ISA.CRAYNV2:       return 'Cray NV2 vector architecture';
        case ELF.ISA.RX:            return 'Renesas RX';
        case ELF.ISA.METAG:         return 'Imagination Tech. META';
        case ELF.ISA.MCST_ELBRUS:   return 'MCST Elbrus';
        case ELF.ISA.ECOG16:        return 'Cyan Technology eCOG16';
        case ELF.ISA.CR16:          return 'National Semi. CompactRISC CR16';
        case ELF.ISA.ETPU:          return 'Freescale Extended Time Processing Unit';
        case ELF.ISA.SLE9X:         return 'Infineon Tech. SLE9X';
        case ELF.ISA.L10M:          return 'Intel L10M';
        case ELF.ISA.K10M:          return 'Intel K10M';
        case ELF.ISA.AARCH64:       return 'ARM AARCH64';
        case ELF.ISA.AVR32:         return 'Amtel 32-bit microprocessor';
        case ELF.ISA.STM8:          return 'STMicroelectronics STM8';
        case ELF.ISA.TILE64:        return 'Tileta TILE64';
        case ELF.ISA.TILEPRO:       return 'Tilera TILEPro';
        case ELF.ISA.MICROBLAZE:    return 'Xilinx MicroBlaze';
        case ELF.ISA.CUDA:          return 'NVIDIA CUDA';
        case ELF.ISA.TILEGX:        return 'Tilera TILE-Gx';
        case ELF.ISA.CLOUDSHIELD:   return 'CloudShield';
        case ELF.ISA.COREA_1ST:     return 'KIPO-KAIST Core-A 1st gen.';
        case ELF.ISA.COREA_2ND:     return 'KIPO-KAIST Core-A 2nd gen.';
        case ELF.ISA.ARC_COMPACT2:  return 'Synopsys ARCompact V2';
        case ELF.ISA.OPEN8:         return 'Open8 RISC';
        case ELF.ISA.RL78:          return 'Renesas RL78';
        case ELF.ISA.VIDEOCORE5:    return 'Broadcom VideoCore V';
        case ELF.ISA.ISA78KOR:      return 'Renesas 78KOR';
        case ELF.ISA.ISA56800EX:    return 'Freescale 56800EX DSC';
        case ELF.ISA.BA1:           return 'Beyond BA1';
        case ELF.ISA.BA2:           return 'Beyond BA2';
        case ELF.ISA.XCORE:         return 'XMOS xCORE';
        case ELF.ISA.MCHP_PIC:      return 'Microchip 8-bit PIC(r)';
        case ELF.ISA.KM32:          return 'KM211 KM32';
        case ELF.ISA.KMX32:         return 'KM211 KMX32';
        case ELF.ISA.EMX16:         return 'KM211 KMX16';
        case ELF.ISA.EMX8:          return 'KM211 KMX8';
        case ELF.ISA.KVARC:         return 'KM211 KVARC';
        case ELF.ISA.CDP:           return 'Paneve CDP';
        case ELF.ISA.COGE:          return 'Cognitive Smart Memory Processor';
        case ELF.ISA.COOL:          return 'Bluechip CoolEngine';
        case ELF.ISA.NORC:          return 'Nanoradio Optimized RISC';
        case ELF.ISA.CSR_KALIMBA:   return 'CSR Kalimba';
        case ELF.ISA.Z80:           return 'Zilog Z80';
        case ELF.ISA.VISIUM:        return 'Controls and Data Services VISIUMcore';
        case ELF.ISA.FT32:          return 'FTDI Chip FT32';
        case ELF.ISA.MOXIE:         return 'Moxie processor';
        case ELF.ISA.AMDGPU:        return 'AMD GPU';
        case ELF.ISA.RISCV:         return 'RISC-V';
        case ELF.ISA.BPF:           return 'Linux BPF';
        case ELF.ISA.CSKY:          return 'C-SKY';
    }
}

export function abiToString(abi: ELF.ABI): string {
    switch (abi) {
        case ELF.ABI.GNUHurd:        return 'GNU Hurd';
        case ELF.ABI.NovelloModesto: return 'Novello Modesto';
        case ELF.ABI.HPUX:           return 'HP-UX';
        case ELF.ABI.NonStopKernel:  return 'NonStop Kernel';
        case ELF.ABI.FenixOS:        return 'Fenix OS';
        case ELF.ABI.ARMEABI:        return 'ARM EABI';
        default:                     return ELF.ABI[abi] || abi.toString();
    }
}

export function elfTypeToString(elfType: ELF.Type): string {
    return ELF.Type[elfType] || elfType.toString();
}

export function segmentTypeToString(segmentType: ELF.SegmentType): string {
    switch (segmentType) {
        case ELF.SegmentType.ProgramHeaderTable: return 'Program Header Table';
        case ELF.SegmentType.GnuEhFrame:         return 'GNU EH frame';
        case ELF.SegmentType.GnuStack:           return 'GNU stack info';
        case ELF.SegmentType.GnuRelRo:           return 'GNU ro relocation';
        default:                                 return ELF.SegmentType[segmentType] || segmentType.toString();
    }
}

export function sectionTypeToString(sectionType: ELF.SectionType): string {
    switch (sectionType) {
        case ELF.SectionType.Null:          return 'NULL';
        case ELF.SectionType.ProgBits:      return 'Prog bits';
        case ELF.SectionType.SymTab:        return 'Symbol table';
        case ELF.SectionType.StrTab:        return 'String table';
        case ELF.SectionType.Rela:          return 'Relocation with addends';
        case ELF.SectionType.Hash:          return 'Symbol hash table';
        case ELF.SectionType.Dynamic:       return 'Dynamic';
        case ELF.SectionType.Note:          return 'Note';
        case ELF.SectionType.NoBits:        return 'No bits';
        case ELF.SectionType.Rel:           return 'Relocation';
        case ELF.SectionType.ShLib:         return 'ShLib';
        case ELF.SectionType.DynSym:        return 'Dynamic linking symbols';
        case ELF.SectionType.InitArray:     return 'Init array';
        case ELF.SectionType.FiniArray:     return 'Fini array';
        case ELF.SectionType.PreInitArray:  return 'Pre-init array';
        case ELF.SectionType.Group:         return 'Section group';
        case ELF.SectionType.ShNdx:         return 'Extended symbol table index';
        case ELF.SectionType.Num:           return 'Num';
        case ELF.SectionType.GnuAttributes: return 'GNU object attributes';
        case ELF.SectionType.GnuHash:       return 'GNU hash';
        case ELF.SectionType.GnuLibList:    return 'GNU pre-link library list';
        case ELF.SectionType.GnuVerDef:     return 'GNU version definition';
        case ELF.SectionType.GnuVerNeed:    return 'GNU version needs';
        case ELF.SectionType.GnuVerSym:     return 'GNU version symbol table';
        case ELF.SectionType.RPLExports:    return 'RPL exports';
        case ELF.SectionType.RPLImports:    return 'RPL imports';
        case ELF.SectionType.RPLCrcs:       return 'RPL CRCs';
        case ELF.SectionType.RPLFileInfo:   return 'RPL File Info';
        default:                            return ELF.SectionType[sectionType] || Number(sectionType).toString();
    }
}

export function sectionFlagsToString(flags: number | bigint) {
    flags = Number(flags); // no flags are more than 32 bits

    let str = [];
    if (flags & 0x1)       str.push('Writeable');
    if (flags & 0x2)       str.push('Alloc');
    if (flags & 0x4)       str.push('Executable');
    if (flags & 0x10)      str.push('Merge');
    if (flags & 0x20)      str.push('Strings');
    if (flags & 0x40)      str.push('Info Link');
    if (flags & 0x80)      str.push('Link Order');
    if (flags & 0x100)     str.push('Nonconforming');
    if (flags & 0x200)     str.push('Group');
    if (flags & 0x400)     str.push('Thread Local Storage');
    if (flags & 0x4000000) str.push('Special ordering');
    if (flags & 0x8000000) str.push('Exclude');
    if (str.length === 0) return '<none>';
    return str.join(' | ');
}

export function programHeaderFlagsToString(flags: number) {
    let str = [];
    if (flags & 0x4) str.push('Read');
    if (flags & 0x2) str.push('Write');
    if (flags & 0x1) str.push('Execute');
    return str.join(' | ');
}

export function elfFlagsToString(isa: ELF.ISA, flags: number): string {
    if (isa === ELF.ISA.ARM) {
        const ver = ((flags & 0xFF000000) >> 24);
        let str = [`Version: ${ver}`];

        if (flags & 0x00800000)             str.push('BE-8');
        if (ver <= 4 && flags & 0x00400000) str.push('Legacy');
        if (ver >= 5 && flags & 0x00000400) str.push('Hard Float');
        if (ver >= 5 && flags & 0x00000200) str.push('Soft Float');
        return str.join(' | ');
    }

    return flags.toString();
}

export function symbolTypeToString(type: ELF.SymbolType) {
    switch (type) {
        case ELF.SymbolType.RelocationExpression:       return 'Relocation Expression';
        case ELF.SymbolType.SignedRelocationExpression: return 'Signed Relocation Expression';
        case ELF.SymbolType.ThreadLocalStorage:         return 'Thread Local Storage';
        default:                                        return ELF.SymbolType[type] || type.toString();
    }
}

export function symbolBindingToString(binding: ELF.SymbolBinding) {
    return ELF.SymbolBinding[binding] || binding.toString();
}

export function symbolVisibilityToString(visibility: ELF.SymbolVisibility) {
    return ELF.SymbolVisibility[visibility] || visibility.toString();
}
