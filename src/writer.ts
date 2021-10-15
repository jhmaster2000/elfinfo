import { encode } from './encoding';
import { ELF, ELFPackResult, ELFSection, PackedELFSection } from './types';

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

    const elfbuf: Buffer = Buffer.alloc(elf.size);

    writeBufferToBuffer(elfbuf, packELFHeader(elf), 0);

    result.data = elfbuf;
    return result;
}

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

export function packELFSection(section: ELFSection): PackedELFSection {
    //const databuf = Buffer.alloc(section.offset === 0 ? 0 : section.size);
    //let ix = 0;
    //if (databuf.byteLength !== 0) {
    //    writeBufferToBuffer(databuf, section.data, 0);
    //}

    return {
        headerIndex: section.index,
        dataOffset: section.offset,
        data: section.data
    }
}
