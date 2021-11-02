import { nybble, Union, uint8, uint16, uint32, uint64, sint8, sint16, sint32, sint64 } from './primitive';
import { Header } from './header';
import { Section } from './sections';

export class File {
    /** The main header of the ELF file. */
    header: Header = new Header();
    /** The segments for the ELF file, parsed from program header entries. */
    //segments: Segment[] = [];
    /** The sections for the ELF file, parsed from section header entries. */
    sections: Section[] = [];
}

export * from './rplfileinfo';
export * from './relocation';
export * from './sections';
export * from './structs';
export * from './symbol';
export * from './header';
export * from './enums';
