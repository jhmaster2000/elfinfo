import { nybble, Union, uint8, uint16, uint32, uint64, sint8, sint16, sint32, sint64 } from './primitive.js';
import { Header } from './header.js';
import { Section } from './sections.js';
import { Endian, SectionFlags, SectionType } from './enums.js';
import util from 'util';
import zlib from 'zlib';
import { trimBuffer } from '../encoding.js';
import { isRelocationSection, isStringSection, isSymbolSection, readRelocationSection, readStringSection, readSymbolsSection } from '../sections.js';
const inflate = util.promisify(zlib.inflate);
const deflate = util.promisify(zlib.deflate);

export class File {
    /** The main header of the ELF file. */
    header: Header = new Header();
    /** The segments for the ELF file, parsed from program header entries. */
    //segments: Segment[] = [];
    /** The sections for the ELF file, parsed from section header entries. */
    sections: Section[] = [];

    async decompress(): Promise<boolean> {
        const sections: Section[] = this.sections.filter(section => section.flags & SectionFlags.Compressed);
        if (sections.length === 0) return false;

        for (const section of sections) {
            const decompressed = await inflate(new Uint8Array(trimBuffer(section.data, 4)));
            section.flags &= ~SectionFlags.Compressed;
            section.data = new Uint8Array(trimBuffer(decompressed));

            if (isStringSection(section)) section.strings = readStringSection(section);
            if (isSymbolSection(section)) section.symbols = readSymbolsSection(section, this.header.endian, this.header.bits);
            if (isRelocationSection(section)) section.relocations = readRelocationSection(section, this.header.endian, this.header.bits);
        }
        this.updateSectionHeaders();
        return true;
    }

    async compress(): Promise<boolean> {
        const compressionBlacklist = [SectionType.NoBits, SectionType.RPLCrcs, SectionType.RPLFileInfo];
        const sections = this.sections.filter(section => {
            return section.offset !== 0 && !(section.flags & SectionFlags.Compressed) && !compressionBlacklist.includes(section.type)
        });
        if (sections.length === 0) return false;

        for (const section of sections) {
            const compressed = Buffer.concat([Buffer.alloc(4), await deflate(section.data)]);
            compressed.writeUInt32BE(section.sizeUncompressed, 0);
            if (compressed.byteLength > section.sizeUncompressed) continue;

            section.flags |= SectionFlags.Compressed;
            section.data = new Uint8Array(trimBuffer(compressed));

            if (isStringSection(section)) section.strings = {};
            if (isSymbolSection(section)) section.symbols = [];
            if (isRelocationSection(section)) section.relocations = [];
        }
        this.updateSectionHeaders();
        return true;
    }

    /** Updates the file offset of all sections. */
    updateSectionHeaders(): void {
        const sectionHeadersEnd = this.header.sectionHeadersOffset + this.header.sectionHeadersEntrySize * this.header.sectionHeadersEntryCount;
        const programHeadersEnd = this.header.programHeadersOffset + this.header.programHeadersEntrySize * this.header.programHeadersEntryCount;
        const sectionsStartOffset = sectionHeadersEnd >= programHeadersEnd ? sectionHeadersEnd : programHeadersEnd;
        const sections = this.sections.filter(section => section.offset !== 0).sort((a, b) => a.offset - b.offset);

        let offset = sectionsStartOffset;
        for (const section of sections) {
            if (section.type === SectionType.RPLCrcs) section.size = this.sections.length * section.entSize;

            section.offset = offset;
            const align = section.addrAlign === 0x4 ? 0x10 : section.addrAlign;
            offset = Math.ceil((offset + section.size) / align) * align;
        }
    }
}

export * from './rplfileinfo.js';
export * from './relocation.js';
export * from './sections.js';
export * from './structs.js';
export * from './symbol.js';
export * from './header.js';
export * from './enums.js';
