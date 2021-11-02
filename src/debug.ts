import { isRelocationSection, isStringSection, isSymbolSection } from './sections';
import {
    abiToString, elfFlagsToString, isaToString, elfTypeToString, sectionFlagsToString, sectionTypeToString,
    symbolBindingToString, symbolTypeToString, symbolVisibilityToString
} from './strings';
import * as ELF from './types';

export function hexdump(buf: Buffer): string {
    const basestr = buf.toString('hex').toUpperCase();
    if (!basestr) return '';
    return basestr.match(/../g)!.join(' ').match(/(?:...?){1,16}/g)!.join('\n');
}

function toHex(n: number | bigint | undefined, padamount: number = 0, lowercase: boolean = false) {
    if (n !== undefined) {
        const hexchars = n.toString(16);
        if (padamount === 0) {
            padamount = (typeof n === 'bigint') ? 8 :
                         (hexchars.length <= 2) ? 2 :
                         (hexchars.length <= 4) ? 4 : 8;
        }
        return lowercase ? `0x${hexchars.padStart(padamount, '0')}` : '0x' + `${hexchars.padStart(padamount, '0')}`.toUpperCase();
    } else {
        return '<undefined>';
    }
}

interface DebugOptions {
    printSections?: boolean;
    printStrings?: boolean;
    printSymbols?: boolean;
    printRelocations?: boolean;
}

const DefaultDebugOptions: DebugOptions = {
    printSections: false,
    printStrings: false,
    printSymbols: false,
    printRelocations: false
};

/** Print debug information for an ELF file, similar to readelf or objdump.
  * @param {ELF.File} elf The parsed ELF file data to print debug info for.
  * @param {(boolean | DebugOptions)} [options=DefaultDebugOptions] If true, all debug info will be printed.
  * @returns {string} The debug info for the ELF file.
  */
export function debug(elf: ELF.File, options: boolean | DebugOptions = DefaultDebugOptions): string {
    let result = '';

    if (options === false) options = DefaultDebugOptions;
    if (options === true) options = {
        printSections: true, printStrings: true, printSymbols: true, printRelocations: true
    } as DebugOptions;

    if (!options.printSections && (options.printStrings || options.printSymbols || options.printRelocations)) options.printSections = true;

    if (elf) {
        const addrpad = elf.header.class ? elf.header.class * 8 : 8;
        result += `Class:                             ${elf.header.class ? elf.header.class === ELF.Class.ELF32 ? 'ELF32' : 'ELF64' : 'None'} (${elf.header.class})\n`;
        result += `Bits:                              ${elf.header.bits} bits\n`;
        result += `Data:                              ${elf.header.endian ? elf.header.endian === ELF.Endian.Big ? 'Big Endian' : 'Little Endian' : 'None'} (${elf.header.endian})\n`;
        result += `Version:                           ${elf.header.version}\n`;
        result += `OS/ABI:                            ${abiToString(elf.header.abi)} (${toHex(elf.header.abi)})\n`;
        result += `ABI version:                       ${elf.header.abiVersion}\n`;
        result += `Type:                              ${elfTypeToString(elf.header.type)} (${toHex(elf.header.type)})\n`;
        result += `ISA/machine:                       ${isaToString(elf.header.isa)} (${toHex(elf.header.isa)})\n`;
        result += `ISA/machine version:               ${elf.header.isaVersion}\n`;
        result += `Entry Point:                       ${toHex(elf.header.entryPoint)}\n`;
        result += `Program header offset:             ${toHex(elf.header.programHeadersOffset)}\n`;
        result += `Section header offset:             ${toHex(elf.header.sectionHeadersOffset)}\n`;
        result += `Flags:                             ${elfFlagsToString(elf.header.isa, elf.header.flags)} (${toHex(elf.header.flags)})\n`;
        //TODO: result += `Program headers:                   ${elf.programHeaderEntrySize} bytes × ${elf.segments.length}\n`;
        result += `Section headers:                   ${elf.header.sectionHeadersEntrySize} bytes × ${elf.sections.length}\n`;
        result += `String table section index:        ${elf.header.shstrIndex}\n`;

        // TODO: Segments support
        /*if (elf.segments.length) {
            result += '\n\nProgram Header Entries:\n\n';
            if (elf.bits === 32) {
                result += '    #   Type                 Offset     VirtAddr   PhysAddr   FileSize   MemSiz     Align      Flags\n';
            } else {
                result += '    #   Type                 Offset             VirtAddr           PhysAddr           FileSize           MemSiz             Align      Flags\n';
            }
            for (const header of elf.segments) {
                result += `    ${header.index.toString().padEnd(3)} `
                result += `${header.typeDescription.padEnd(20)} `;
                result += `${toHex(header.offset, addrpad)} `;
                result += `${toHex(header.vaddr, addrpad)} `;
                result += `${toHex(header.paddr, addrpad)} `;
                result += `${toHex(header.filesz, addrpad)} `;
                result += `${toHex(header.memsz, addrpad)} `;
                result += `${toHex(header.align, 8)} `;
                result += `${header.flagsDescription}\n`;
            }
        }*/

        if (elf.sections.length) {
            result += '\n\nSections:\n\n';
            if (elf.header.class === ELF.Class.ELF32) {
                result += '    #   Name               Type                             Address    Offset     Size       EntSize    Link  Info  Align      Flags\n';
            } else {
                result += '    #   Name               Type                             Address            Offset             Size               EntSize            Link  Info  Align      Flags\n';
            }

            for (const section of elf.sections) {
                result += `    ${section.index.toString().padEnd(3)} `
                result += `${section.getName(elf).substr(0, 18).padEnd(18)} `;
                result += `${sectionTypeToString(section.type).padEnd(32)} `;
                result += `${toHex(section.addr, addrpad)} `;
                result += `${toHex(section.offset, addrpad)} `;
                result += `${toHex(section.size, addrpad)} `;
                result += `${toHex(section.entSize, addrpad)} `;
                result += `${(section.link || '').toString().padStart(4)}  `;
                result += `${(section.info || '').toString().padStart(4)}  `;
                result += `${toHex(section.addrAlign, 8)} `;
                result += `${sectionFlagsToString(section.flags)} (${section.flags})\n`;
            }
        }

        for (const section of elf.sections) {
            if (!options.printSections) break;
            result += `\n#${section.index} - ${sectionTypeToString(section.type)} section ${section.getName(elf)}:\n`;

            if (isSymbolSection(section) && options.printSymbols) {
                if (elf.header.class === ELF.Class.ELF32) {
                    result += '      #   Value      Size       Type                         Bind   Visibility Name\n';
                } else {
                    result += '      #   Value              Info       Type                         Bind   Visibility Name\n';
                }

                let ix = 0;
                for (const symbol of section.symbols) {
                    result += `    ${(ix++).toString().padStart(5)} `;
                    result += `${toHex(symbol.value, addrpad)} `;
                    result += `${toHex(symbol.size, 8)} `;
                    result += `${symbolTypeToString(symbol.type).padEnd(28)} `;
                    result += `${symbolBindingToString(symbol.binding).padEnd(6)} `;
                    result += `${symbolVisibilityToString(symbol.visibility).padEnd(10)} `;
                    result += `${symbol.getName(elf)}\n`;
                }
            } else if (isStringSection(section) && options.printStrings) {
                for (const string in section.strings) {
                    result += `  #${string} - ${section.strings[string]}\n`;
                }
            } else if (isRelocationSection(section) && options.printRelocations) {
                if (elf.header.class === ELF.Class.ELF32) {
                    result += '        # Offset     Size       Type                         Bind   Visibility Name\n';
                } else {
                    result += '        # Offset             Size               Type                         Bind   Visibility Name\n';
                }

                let ix = 0;
                for (const relocation of section.relocations) {
                    result += `    ${(ix++).toString().padStart(5)} `;
                    result += `${toHex(relocation.addr, addrpad)} `;
                    result += `${toHex(<number>relocation.info, addrpad)} `;
                    result += '\n';
                }
            }
        }
    } else {
        result += '<undefined>';
    }

    return result;
}
