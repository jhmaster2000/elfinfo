import { nybble, Union, uint8, uint16, uint32, uint64, sint8, sint16, sint32, sint64 } from './primitive.js';
import { Header } from './header.js';
import { Section } from './sections.js';

export class File {
    /** The main header of the ELF file. */
    header: Header = new Header();
    /** The segments for the ELF file, parsed from program header entries. */
    //segments: Segment[] = [];
    /** The sections for the ELF file, parsed from section header entries. */
    sections: Section[] = [];
}

export * from './rplfileinfo.js';
export * from './relocation.js';
export * from './sections.js';
export * from './structs.js';
export * from './symbol.js';
export * from './header.js';
export * from './enums.js';
