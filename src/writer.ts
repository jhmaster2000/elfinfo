import { encode } from './encoding.js';
import { RPL } from './rplsections.js';
import { isRelocationSection, isStringSection, isSymbolSection, packRelocationSection, packStringSection, packSymbolSection } from './sections.js';
import * as ELF from './types/index.js';

/** Write a buffer of data to a larger buffer from an offset */
export function writeBufferToBuffer(buf: Buffer, data: Buffer, offset: number): Buffer {
    if ((offset + data.byteLength) > buf.byteLength) throw new Error('Cannot write outside destination buffer size.');
    if (offset < 0) throw new Error('Offset must be greater than zero.');
    for (let i = 0; i < data.byteLength; i++) buf.writeUInt8(data[i], offset + i);
    return buf;
}

// TODO: Unhardcode this from ELF32 Big Endian + Segments support
export function packElf(elf: ELF.File): Buffer {    
    if (elf.header.class !== ELF.Class.ELF32 || elf.header.endian !== ELF.Endian.Big)
        throw new Error('Only ELF32 Big Endian packing is currently supported.');

    if (elf.header.programHeadersEntryCount !== 0 || /*elf.segments.length !== 0 ||*/ elf.header.programHeadersOffset !== 0)
        console.warn('ELF Segment and program headers packing is not currently supported. Remaining ELF data will still attempt to be packed.');

    let output = { data: Buffer.alloc(elf.header.sectionHeadersOffset + (elf.header.sectionHeadersEntryCount * elf.header.sectionHeadersEntrySize)) };
    writeBufferToBuffer(output.data, packELFHeader(elf), 0);
    writeBufferToBuffer(output.data, packELFSectionHeaders(elf), elf.header.sectionHeadersOffset);

    const sections = elf.sections.filter(section => section.offset !== 0).sort((a, b) => a.offset - b.offset);

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const padding = section.offset - output.data.byteLength;
        output.data = Buffer.concat([output.data, Buffer.alloc(padding + section.size)]);

        if (isStringSection(section)) {
            writeBufferToBuffer(output.data, packStringSection(section), section.offset); continue;
        }
        if (isSymbolSection(section)) {
            writeBufferToBuffer(output.data, packSymbolSection(section), section.offset); continue;
        }
        if (isRelocationSection(section)) {
            writeBufferToBuffer(output.data, packRelocationSection(section), section.offset); continue;
        }
        if (RPL.isCrcSection(section)) {
            writeBufferToBuffer(output.data, RPL.packCrcSection(section), section.offset); continue;
        }
        if (RPL.isFileInfoSection(section)) {
            writeBufferToBuffer(output.data, RPL.packFileInfoSection(section), section.offset); continue;
        }

        writeBufferToBuffer(output.data, Buffer.from(section.data), section.offset);
    }
    
    const align = (output.data.byteLength + 3 & -4) - output.data.byteLength;
    if (align !== 0) Buffer.concat([output.data, Buffer.alloc(align)]);

    return output.data;
}

/** Pack the header of an ELF file to binary. */
function packELFHeader(elf: ELF.File): Buffer {
    const headerbuf: Buffer = Buffer.alloc(0x34);
    let ix = 0;

    headerbuf.write('\x7FELF', ix, 'utf-8'); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.header.class, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.header.endian, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.header.version, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.header.abi, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.header.abiVersion, 1), ix); ix += 1;
    headerbuf.write('\0'.repeat(7), ix, 'utf-8'); ix += 7; // Padding
    writeBufferToBuffer(headerbuf, encode(elf.header.type, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.header.isa, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.header.isaVersion, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(Number(elf.header.entryPoint), 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.header.programHeadersOffset, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.header.sectionHeadersOffset, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.header.flags, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(0x34, 2), ix); ix += 2; // ELF header size
    writeBufferToBuffer(headerbuf, encode(elf.header.programHeadersEntrySize, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.header.programHeadersEntryCount, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.header.sectionHeadersEntrySize, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.header.sectionHeadersEntryCount, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.header.shstrIndex, 2), ix); ix += 2;

    return headerbuf;
}

/** Pack the section header table of an ELF file to binary. */
export function packELFSectionHeaders(elf: ELF.File): Buffer {
    const shbuf: Buffer = Buffer.alloc(elf.header.sectionHeadersEntryCount * elf.header.sectionHeadersEntrySize);
    let ix = 0;

    elf.sections.forEach((section: ELF.Section) => {
        //!writeBufferToBuffer(shbuf, encode(section.nameix, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.type, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.flags, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(Number(section.addr), 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.offset, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.size, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.link, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.info, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.addrAlign, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.entSize, 4), ix); ix += 4;
    });

    return shbuf;
}
