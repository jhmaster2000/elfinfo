import * as ELF from './types';
import { uint32, uint64 } from './types/primitive';
import { add, subtract, toNumberSafe } from './biginthelpers';
import { isSymbolSection } from './sections';

function filterSymbolsByVirtualAddress(elf: ELF.File, start: uint32 | uint64, size: uint32 | uint64): ELF.Symbol[] {
    const end = add(start, size);

    const symbols = [];
    for (const section of elf.sections) {
        if (isSymbolSection(section)) {
            for (const symbol of section.symbols) {
                if (symbol.virtualAddress && symbol.virtualAddress >= start && symbol.virtualAddress < end) {
                    symbols.push(symbol);
                }
            }
        }
    }

    return symbols;
}



/** Get a consolidates array of all the symbols in the file.
  * @param elf the ELF file.
  * @returns an array of symbols. */
export function getSymbols(elf: ELF.File): ELF.Symbol[] {
    const result = [];
    for (const section of elf.sections) {
        if (isSymbolSection(section)) {
            for(const sym of section.symbols) {
                result.push(sym);
            }
        }
    }
    return result;
}

/** Get all the symbols that are addressed inside a given section.
 * @param elf the ELF file.
 * @param {ELF.Section | uint32} sectionOrIndex either the section or the index of the section.
 * @returns {ELF.Symbol[]} an array of symbols that are addressed in the section. */
export function getSymbolsInSection(elf: ELF.File, sectionOrIndex: ELF.Section | uint32): ELF.Symbol[] {
    const section = typeof sectionOrIndex === 'number' ? elf.sections[sectionOrIndex] : sectionOrIndex;
    return filterSymbolsByVirtualAddress(elf, section.addr, section.size);
}

/** Get all the symbols that are addressed inside a given segment.
 * @param {ELF.Segment | uint32} segmentOrIndex either the segment or the index of the segment.
 * @returns {ELF.Symbol[]} an array of symbols that are addressed in the segment. */
/*export function getSymbolsInSegment(elf: ELF.File, segmentOrIndex: ELF.Segment | uint32): ELF.Symbol[] {
    const segment = typeof segmentOrIndex === 'number' ? elf.segments[segmentOrIndex] : segmentOrIndex;
    return filterSymbolsByVirtualAddress(elf, segment.vaddr, segment.memsz);
}*/

/** Get all the section that are addressed inside a given segment.
 * @param {ELF.Segment | uint32} segmentOrIndex either the segment or the index of the segment.
 * @returns {ELF.Section[]} an array of sections that are addressed in the segment. */
/*export function getSectionsInSegment(elf: ELF.File, segmentOrIndex: ELF.Segment | uint32): ELF.Section[] {
    const segment = typeof segmentOrIndex === 'number' ? elf.segments[segmentOrIndex] : segmentOrIndex;

    return elf.sections.filter(x => x.addr > segment.vaddr && x.addr < add(segment.vaddr, segment.memsz));
}*/

/** Get the first section in which a symbol is addressed.
 * @param {ELF.Symbol} symbol The symbol
 * @returns {ELF.Section[]} an array of sections that contain the symbol.
 */
export function getSectionsForSymbol(elf: ELF.File, symbol: ELF.Symbol): ELF.Section[] {
    const sections = [];
    for (const section of elf.sections) {
        if (symbol.virtualAddress &&
            symbol.virtualAddress >= section.addr &&
            symbol.virtualAddress <= add(section.addr, section.size)) {
            sections.push(section);
        }
    }

    return sections;
}

/** Get all sections in which a symbol is addressed.
 * @param {ELF.Symbol} symbol The symbol
 * @returns {ELF.Section} the first section which contains the symbol. */
export function getSectionForSymbol(elf: ELF.File, symbol: ELF.Symbol): ELF.Section {
    return getSectionsForSymbol(elf, symbol)[0]
}

/** Get the first segment in which a symbol is addressed.
 * @param {ELF.Symbol} symbol The symbol
 * @returns {ELF.Section} all segments which contain the symbol. */
/*export function getSegmentsForSymbol(elf: ELF.File, symbol: ELF.Symbol): ELF.Segment[] {
    const segments = [];
    for (const segment of elf.segments) {
        if (symbol.virtualAddress &&
            symbol.virtualAddress >= segment.vaddr &&
            symbol.virtualAddress <= add(segment.vaddr, segment.memsz)) {
            segments.push(segment);
        }
    }

    return segments;
}*/

/** Get the first segment in which a symbol is addressed.
 * @param {ELF.Symbol} symbol The symbol
 * @returns {ELF.Section} the first segment which contains the symbol. */
/*export function getSegmentForSymbol(elf: ELF.File, symbol: ELF.Symbol): ELF.Segment | undefined {
    return getSegmentsForSymbol(elf, symbol)[0];
}*/

/** Find all symbols inside that overlap a given virtual memory location.
 * @param {uint32 | uint64} location The virtual memory address.
 * @returns {ELF.Symbol[]} an array of symbols that contain the location. */
export function getSymbolsAtVirtualMemoryLocation(elf: ELF.File, location: uint32 | uint64): ELF.Symbol[] {
    const symbols: ELF.Symbol[] = [];
    for (const section of elf.sections) {
        if (isSymbolSection(section)) {
            for (const symbol of section.symbols) {
                if (symbol.size === 0) {
                    if (symbol.virtualAddress === location) {
                        symbols.push(symbol);
                    }
                } else {
                    if (symbol.virtualAddress &&
                        location >= symbol.virtualAddress &&
                        location < add(symbol.virtualAddress, symbol.size)) {
                        symbols.push(symbol);
                    }
                }
            }
        }
    }

    return symbols;
}

/** Find all symbols inside that overlap a given physical memory location.
 * @param {uint32 | uint64} location The physical memory address.
 * @returns {ELF.Symbol[]} an array of symbols that contain the location.
*/
export function getSymbolsAtPhysicalMemoryLocation(elf: ELF.File, location: uint32 | uint64): ELF.Symbol[] {
    let virtualAddress// = physicalAddressToVirtual(elf, location);
    if (virtualAddress) {
        return getSymbolsAtVirtualMemoryLocation(elf, virtualAddress);
    } else {
        return [];
    }
}

/** Get all the sections that overlap a given virtual memory location
 * @param {uint32 | uint64} location The virtual memory address.
 * @returns {ELF.Section[]} an array of sections that find the location inside of them.
*/
export function getSectionsAtVirtualMemoryLocation(elf: ELF.File, location: uint32 | uint64): ELF.Section[] {
    const sections = [];
    for (const section of elf.sections) {
        if (location >= section.addr && location < add(section.addr, section.size)) {
            sections.push(section);
        }
    }

    return sections;
}

/** Get all the sections that overlap a given physical memory location
 * @param {uint32 | uint64} location The physical memory address.
 * @returns {ELF.Section[]} an array of sections that find the location inside of them.
*/
export function getSectionsAtPhysicalMemoryLocation(elf: ELF.File, location: uint32 | uint64): ELF.Section[] {
    let virtualAddress// = physicalAddressToVirtual(elf, location);
    if (virtualAddress) {
        return getSectionsAtVirtualMemoryLocation(elf, virtualAddress);
    } else {
        return [];
    }
}

/** Get all the segments that overlap a given virtual memory location
 * @param {uint32 | uint64} location The virtual memory address.
 * @returns {ELF.Section} all segments which contain the address. */
/*export function getSegmentsAtVirtualMemoryLocation(elf: ELF.File, location: number | bigint): ELF.Segment[] {
    const segments = [];
    for (const segment of elf.segments) {
        if (location >= segment.vaddr && location < add(segment.vaddr, segment.memsz)) {
            segments.push(segment);
        }
    }
    return segments;
}*/

/** Get all the segments that overlap a given physical memory location
 * @param {uint32 | uint64} location The physical memory address.
 * @returns {ELF.Section} all segments which contain the address. */
/*export function getSegmentsAtPhysicalMemoryLocation(elf: ELF.File, location: number | bigint): ELF.Segment[] {
    const segments = [];
    for (const segment of elf.segments) {
        if (location >= segment.paddr && location < add(segment.paddr, segment.filesz)) {
            segments.push(segment);
        }
    }
    return segments;
}*/

/** translate a virtual address to a physical address, if possible.
 * @param location The virtual memory address.
 * @returns the physical address. */
/*export function virtualAddressToPhysical(elf: ELF.File, location: uint32 | uint64): uint32 | uint64 | undefined {
    for (const segment of elf.segments) {
        if (location >= segment.vaddr && location <= add(segment.vaddr, segment.memsz)) {
            const offset = subtract(location, segment.vaddr);
            if (offset < segment.filesz) {
                return add(segment.paddr, offset);
            }
        }
    }

    return undefined;
}*/

/** translate a virtual address to an offset in the ELF file, if possible.
 * @param {uint32 | uint64} location The virtual memory address.
 * @returns {uint32 | uint64} the file offset. */
/*export function virtualAddressToFileOffset(elf: ELF.File, location: uint32 | uint64): uint32 | undefined {
    for (const segment of elf.segments) {
        if (location >= segment.vaddr && location < add(segment.vaddr, segment.memsz)) {
            const offset = toNumberSafe(subtract(location, segment.vaddr));
            if (offset < segment.filesz) {
                return segment.offset + offset;
            }
        }
    }

    return undefined;
}*/

/** translate a physical address to a virtual address.
 * @param {uint32 | uint64} location The physical memory address.
 * @returns {uint32 | uint64} the virtual address. */
/*export function physicalAddressToVirtual(elf: ELF.File, location: uint32 | uint64): uint32 | uint64 | undefined {
    for (const segment of elf.segments) {
        if (location >= segment.paddr && location < add(segment.paddr, segment.filesz)) {
            const offset = subtract(location, segment.paddr);
            return add(segment.vaddr, offset);
        }
    }

    return undefined;
}*/

/** translate a physical address to an offset in the ELF file.
 * @param {uint32 | uint64} location The physical memory address.
 * @returns {uint32 | uint64} the file offset. */
/*export function physicalAddressToFileOffset(elf: ELF.File, location: uint32 | uint64): uint32 | undefined {
    for (const segment of elf.segments) {
        if (location >= segment.paddr && location < add(segment.paddr, segment.filesz)) {
            const offset = toNumberSafe(subtract(location, segment.paddr));
            return segment.offset + offset;
        }
    }

    return undefined;
}*/

/** translate a file offset to a physical address, if possible.
 * @param {uint32} location The file offset.
 * @returns {uint32 | uint64} the physical address. */
/*export function fileOffsetToPhysicalAddress(elf: ELF.File, location: uint32): uint32 | uint64 | undefined {
    for (const segment of elf.segments) {
        if (location >= segment.offset && location < add(segment.offset, segment.filesz)) {
            const offset = subtract(location, segment.offset);
            return add(segment.paddr, offset);
        }
    }

    return undefined;
}*/

/** translate a file offset to a virtual address, if possible.
 * @param {uint32} location The file offset.
 * @returns {uint32 | uint64} the virtual address. */
/*export function fileOffsetToVirtualAddress(elf: ELF.File, location: uint32): uint32 | uint64 | undefined {
    for (const segment of elf.segments) {
        if (location >= segment.offset && location < add(segment.offset, segment.filesz)) {
            const offset = subtract(location, segment.offset);
            return add(segment.vaddr, offset);
        }
    }

    return undefined;
}*/

/** Get the first section that matches the name (case-insensitive).
 * @param {string} sectionName the name of the section to find.
 * @returns {ELF.Section} The first section that matches the name
*/
/*export function getSectionByName(elf: ELF.File, sectionName: string): ELF.Section {
    return getSectionsByName(elf, sectionName)[0];
}*/

/** Get all sections that matches the name (case-insensitive).
 * @param {string} sectionName the name of the sections to find.
 * @returns {ELF.Section[]} an array of sections that match the name.
*/
/*export function getSectionsByName(elf: ELF.File, sectionName: string): ELF.Section[] {
    return elf.sections.filter(s => s.name.toUpperCase() === sectionName.toUpperCase());
}*/

/** Get the first symbol that matches the name (case-insensitive).
 * @param {string} symbolName the name of the symbol to find.
 * @returns {ELF.Symbol[]} an array of symbols that match the name.
*/
export function getSymbolByName(elf: ELF.File, symbolName: string): ELF.Symbol | undefined {
    for (const section of elf.sections) {
        if (isSymbolSection(section)) {
            for (const symbol of section.symbols) {
                //if (symbol.name && symbol.name.toUpperCase() === symbolName.toUpperCase()) {
                    return symbol
                //}
            }
        }
    }

    return undefined;
}

/** Get all symbols that matches the name (case-insensitive).
 * @param {string} symbolName the name of the symbols to find.
 * @returns {ELF.Symbol[]} an array of symbols that match the name. */
export function getSymbolsByName(elf: ELF.File, symbolName: string): ELF.Symbol[] {
    const matches = [];
    for (const section of elf.sections) {
        if (isSymbolSection(section)) {
            for (const symbol of section.symbols) {
                //if (symbol.name && symbol.name.toUpperCase() === symbolName.toUpperCase()) {
                    matches.push(symbol);
                //}
            }
        }
    }
    return matches;
}
