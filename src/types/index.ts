import { nybble, Union, uint8, uint16, uint32, uint64, sint8, sint16, sint32, sint64 } from './primitive.js';
import { Header } from './header.js';
import { Section } from './sections.js';
import { Endian, SectionFlags, SectionType } from './enums.js';
import util from 'util';
import zlib from 'zlib';
import { trimBuffer } from '../encoding.js';
import { isRelocationSection, isStringSection, isSymbolSection, readRelocationSection, readStringSection, readSymbolsSection } from '../sections.js';
const inflate = util.promisify(zlib.inflate);

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
            section.data = new Uint8Array(trimBuffer(decompressed));
            section.flags &= ~SectionFlags.Compressed;
            if (isStringSection(section)) section.strings = await readStringSection(section);
        }

        for (const section of sections) {
            if (isSymbolSection(section)) {
                const { index, size, offset, entSize, link } = section;
                section.symbols = await readSymbolsSection(
                    section.data, offset, size, entSize, this.header.endian === Endian.Big, this.header.bits, index
                );
    
                /*if (link >= 0 && link < this.sections.length) {
                    const stringsSection = this.sections[link];
                    if (isStringSection(stringsSection)) {
                        //fillInSymbolNames(section.symbols, stringsSection.strings);
                    } else {
                        // TODO: error: linked section is not a string table
                    }
                }*/
            }
    
            if (isRelocationSection(section)) {
                const { size, offset, entSize } = section;
                section.relocations = await readRelocationSection(
                    section.data, offset, size, entSize, this.header.endian === Endian.Big, this.header.bits, section.type === SectionType.Rela
                );
            }
        }
        return true;
    }
}

export * from './rplfileinfo.js';
export * from './relocation.js';
export * from './sections.js';
export * from './structs.js';
export * from './symbol.js';
export * from './header.js';
export * from './enums.js';
