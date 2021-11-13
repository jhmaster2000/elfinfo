import { isRelocationSection, isStringSection, isSymbolSection } from './sections.js';
import {
    abiToString, elfFlagsToString, isaToString, elfTypeToString, sectionFlagsToString, sectionTypeToString,
    symbolBindingToString, symbolTypeToString, symbolVisibilityToString
} from './strings.js';
import * as ELF from './types/index.js';
import { Table } from 'console-table-printer';
import { encode } from './encoding.js';

type TableColor = 'red' | 'green' | 'yellow' | 'white' | 'blue' | 'magenta' | 'cyan' | 'white_bold';

const hex = (n: number, prefix = '0x', pad = 0): string => prefix + n.toString(16).toUpperCase().padStart(pad, '0');

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

export function printHeaderTable(elf: ELF.File): void {
    const t = new Table({
        title: 'ELF Header',
        rowSeparator: true,
        columns: [
            { name: '0', alignment: 'left', color: <TableColor>'white',  title: 'Key'   },
            { name: '1', alignment: 'left', color: <TableColor>'yellow', title: 'Value' },
            { name: '2', alignment: 'left', color: <TableColor>'cyan',   title: 'Info'  },
        ]
    });
    t.addRow(['Magic',              hexdump(encode(elf.header.magic)), elf.header.magic.slice(1)]);
    t.addRow(['Class',              elf.header.class,                  elf.header.class ? elf.header.class === ELF.Class.ELF32 ? 'ELF32' : 'ELF64' : 'None']);
    t.addRow(['Endian',             elf.header.endian,                 elf.header.endian ? elf.header.endian === ELF.Endian.Little ? 'Little' : 'Big' : 'None']);
    t.addRow(['Version',            elf.header.version,                elf.header.version ? elf.header.version === ELF.Version.Current ? 'Current' : 'Unknown' : 'None']);
    t.addRow(['ABI',                hex(elf.header.abi),               abiToString(elf.header.abi)]);
    t.addRow(['ABI Version',        hex(elf.header.abiVersion)]);
    t.addRow(['Type',               hex(elf.header.type),              elfTypeToString(elf.header.type)]);
    t.addRow(['ISA',                hex(elf.header.isa),               isaToString(elf.header.isa)]);
    t.addRow(['ISA Version',        hex(elf.header.isaVersion)]);
    t.addRow(['Entrypoint',         hex(<number>elf.header.entryPoint)]);
    t.addRow(['Prog H. Offset',     hex(elf.header.programHeadersOffset)]);
    t.addRow(['Sect H. Offset',     hex(elf.header.sectionHeadersOffset)]);
    t.addRow(['Flags',              hex(elf.header.flags),             elfFlagsToString(elf.header.isa, elf.header.flags)]);
    t.addRow(['ELF Header Size',    hex(elf.header.headerSize)]);
    t.addRow(['Prog H. size',       hex(elf.header.programHeadersEntrySize)]);
    t.addRow(['Prog H. count',      elf.header.programHeadersEntryCount]);
    t.addRow(['Size H. size',       hex(elf.header.sectionHeadersEntrySize)]);
    t.addRow(['Size H. count',      elf.header.sectionHeadersEntryCount]);
    t.addRow(['Size H. strtab Idx', elf.header.shstrIndex]);
    t.printTable();
}

export function printSectionsTable(elf: ELF.File): void {
    let shstrtab: ELF.Section | null | undefined = elf.sections[elf.header.shstrIndex];
    if (shstrtab?.type !== ELF.SectionType.StrTab) shstrtab = undefined;
    else if (shstrtab?.flags && shstrtab?.flags & ELF.SectionFlags.Compressed) shstrtab = null;

    const t = new Table({
        title: `Number of Sections: ${elf.sections.length}`,
        rowSeparator: true,
        columns: [
            { name: 'Index',        alignment: 'left', color: <TableColor>'white_bold' },
            { name: 'Name',         alignment: 'left' },
            { name: 'Name Offs',    alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Type',         alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Flags',        alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Addr',         alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Offset',       alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Size',         alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Link',         alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Info',         alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Align',        alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Ent Size',     alignment: 'left', color: <TableColor>'yellow' },
        ]
    });

    elf.sections.forEach(section => {
        let color: TableColor = 'white';
        const name = section.getName(elf);
        if (section.type === ELF.SectionType.Null)        color = 'red';
        if (section.type === ELF.SectionType.SymTab)      color = 'cyan';
        if (section.type === ELF.SectionType.StrTab)      color = 'blue';
        if (section.type === ELF.SectionType.Rela)        color = 'green';
        if (section.type === ELF.SectionType.Rela)        color = 'green';
        if (section.type === ELF.SectionType.RPLCrcs)     color = 'magenta';
        if (section.type === ELF.SectionType.RPLFileInfo) color = 'magenta';
        if (section.type === ELF.SectionType.NoBits)      color = 'white_bold';

        t.addRow({
            'Index': section.index,
            'Name': shstrtab === null ? '<compressed>' : !shstrtab ? '<none>' : name,
            'Name Offs': hex(section.nameOffset),
            'Type': hex(section.type),
            'Flags': hex(section.flags),
            'Addr': hex(<number>section.addr),
            'Offset': hex(section.offset),
            'Size': hex(section.size),
            'Link': section.link,
            'Info': section.info,
            'Align': hex(section.addrAlign),
            'Ent Size': hex(section.entSize)
        }, { color: color });
    });
    t.printTable();
}

// TODO
export function printCompressionInfoTable(elf: ELF.File): void {
    let shstrtab: ELF.Section | null | undefined = elf.sections[elf.header.shstrIndex];
    if (shstrtab?.type !== ELF.SectionType.StrTab) shstrtab = undefined;
    else if (shstrtab?.flags && shstrtab?.flags & ELF.SectionFlags.Compressed) shstrtab = null;

    const sections: ELF.Section[] = elf.sections.filter(section => section.flags & ELF.SectionFlags.Compressed);

    const t = new Table({
        title: `Compressed Sections: ${sections.length}`,
        rowSeparator: true,
        columns: [
            { name: 'Index',             alignment: 'left', color: <TableColor>'white_bold' },
            { name: 'Name',              alignment: 'left' },
            { name: 'Type',              alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Offset',            alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Compressed',        alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Uncompressed',      alignment: 'left', color: <TableColor>'yellow' },
            { name: 'Size Diff',         alignment: 'left', color: <TableColor>'green' },
            { name: 'Compression Ratio', alignment: 'right', color: <TableColor>'cyan' },
            { name: 'Space Saving',      alignment: 'right', color: <TableColor>'blue' },
        ]
    });

    let data = { ratios: [0], savings: [0] };
    sections.forEach(section => {
        let color: TableColor = 'white';
        const name = section.getName(elf);
        if (section.type === ELF.SectionType.Null)        color = 'red';
        if (section.type === ELF.SectionType.SymTab)      color = 'cyan';
        if (section.type === ELF.SectionType.StrTab)      color = 'blue';
        if (section.type === ELF.SectionType.Rela)        color = 'green';
        if (section.type === ELF.SectionType.Rela)        color = 'green';
        if (section.type === ELF.SectionType.RPLCrcs)     color = 'magenta';
        if (section.type === ELF.SectionType.RPLFileInfo) color = 'magenta';
        if (section.type === ELF.SectionType.NoBits)      color = 'white_bold';

        data.ratios.push(section.sizeUncompressed / section.size);
        data.savings.push((1 - section.size / section.sizeUncompressed) * 100);

        t.addRow({
            'Index': section.index,
            'Name': shstrtab === null ? '<compressed>' : !shstrtab ? '<none>' : name,
            'Type': hex(section.type),
            'Offset': hex(section.offset),
            'Compressed': hex(section.size),
            'Uncompressed': hex(section.sizeUncompressed),
            'Size Diff': '-' + hex(section.sizeUncompressed - section.size),
            'Compression Ratio': (section.sizeUncompressed / section.size).toFixed(1) + ' bytes : byte',
            'Space Saving': ((1 - section.size / section.sizeUncompressed) * 100).toFixed(2) + '%'
        }, { color: color });
    });
    t.table.title = `Compressed Sections: ${sections.length} | `
                  + `Avg. Compression Ratio: ${(data.ratios.reduce((x, y) => x + y) / data.ratios.length).toFixed(1)} bytes : byte | `
                  + `Avg. Space Saving: ${(data.savings.reduce((x, y) => x + y) / data.savings.length).toFixed(2)}%`;
    t.printTable();
}

