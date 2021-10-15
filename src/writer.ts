import { encode } from './encoding';
import { RPL } from './rplsections';
import { ELF, ELFPackResult, ELFSection, SectionHeaderEntryType } from './types';

/** Write a buffer of data to a larger buffer from an offset */
export function writeBufferToBuffer(buf: Buffer, data: Buffer, offset: number): Buffer {
    //console.log('writebuf called:', data);
    if ((offset + data.byteLength) > buf.byteLength) throw new Error('Cannot write outside destination buffer size.');
    if (offset < 0) throw new Error('Offset must be greater than zero.');
    for (let i = 0; i < data.byteLength; i++) buf.writeUInt8(data[i], offset + i);
    return buf;
}

// TODO: Unhardcode this from ELF32 Big Endian + Segments support
export function packElf(elf: ELF): ELFPackResult {
    const result: ELFPackResult = {
        success: false,
        errors: [],
        warnings: []
    }
    
    if (elf.class !== 1 || elf.data !== 2) {
        result.errors.push('Only ELF32 Big Endian packing is currently supported.');
        return result;
    }

    if (elf.numProgramHeaderEntries !== 0 || elf.segments.length !== 0 || elf.programHeaderOffset !== 0)
        result.warnings.push('Segment and program headers packing is not currently supported. Remaining ELF data will still attempt to be packed.');

    result.data = Buffer.alloc(elf.sectionHeaderOffset + (elf.numSectionHeaderEntries * elf.sectionHeaderEntrySize));
    writeBufferToBuffer(result.data, packELFHeader(elf), 0);
    writeBufferToBuffer(result.data, packELFSectionHeaders(elf), elf.sectionHeaderOffset);

    const sections = elf.sections.filter(section => section.offset !== 0).sort((a, b) => a.offset - b.offset);

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const padding = section.offset - result.data.byteLength;
        result.data = Buffer.concat([result.data, Buffer.alloc(padding + section.size)]);

        if (RPL.isCrcSection(section)) {
            writeBufferToBuffer(result.data, RPL.packCrcSection(section), section.offset); continue;
        }
        if (RPL.isFileInfoSection(section)) {
            writeBufferToBuffer(result.data, RPL.packFileInfoSection(section), section.offset); continue;
        }

        writeBufferToBuffer(result.data, section.data, section.offset);
    }
    
    const align = (result.data.byteLength + 3 & -4) - result.data.byteLength;
    if (align !== 0) Buffer.concat([result.data, Buffer.alloc(align)]);

    return result;
}

/** Pack the header of an ELF file to binary. */
function packELFHeader(elf: ELF): Buffer {
    const headerbuf: Buffer = Buffer.alloc(0x34);
    let ix = 0;

    headerbuf.write('\x7FELF', ix, 'utf-8'); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.class, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.data, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.version, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.abi, 1), ix); ix += 1;
    writeBufferToBuffer(headerbuf, encode(elf.abiVersion, 1), ix); ix += 1;
    headerbuf.write('\0'.repeat(7), ix, 'utf-8'); ix += 7; // Padding
    writeBufferToBuffer(headerbuf, encode(elf.type, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.isa, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.isaVersion, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(Number(elf.entryPoint), 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.programHeaderOffset, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.sectionHeaderOffset, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(elf.flags, 4), ix); ix += 4;
    writeBufferToBuffer(headerbuf, encode(0x34, 2), ix); ix += 2; // ELF header size
    writeBufferToBuffer(headerbuf, encode(elf.programHeaderEntrySize, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.numProgramHeaderEntries, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.sectionHeaderEntrySize, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.numSectionHeaderEntries, 2), ix); ix += 2;
    writeBufferToBuffer(headerbuf, encode(elf.shstrIndex, 2), ix); ix += 2;

    return headerbuf;
}

/** Pack the section header table of an ELF file to binary. */
export function packELFSectionHeaders(elf: ELF): Buffer {
    const shbuf: Buffer = Buffer.alloc(elf.numSectionHeaderEntries * elf.sectionHeaderEntrySize);
    let ix = 0;

    elf.sections.forEach((section: ELFSection) => {
        writeBufferToBuffer(shbuf, encode(section.nameix, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.type, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.flags, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(Number(section.addr), 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.offset, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.size, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.link, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.info, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.addralign, 4), ix); ix += 4;
        writeBufferToBuffer(shbuf, encode(section.entsize, 4), ix); ix += 4;
    });

    return shbuf;
}
