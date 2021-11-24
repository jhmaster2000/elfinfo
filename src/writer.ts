import { RPL } from './rplsections.js';
import * as ELF from './types/index.js';

/** @deprecated Write a buffer of data to a larger buffer from an offset */
export function writeBufferToBuffer(buf: Buffer, data: Buffer, offset: number): Buffer {
    if ((offset + data.byteLength) > buf.byteLength) throw new Error('Cannot write outside destination buffer size.');
    if (offset < 0) throw new Error('Offset must be greater than zero.');
    for (let i = 0; i < data.byteLength; i++) buf.writeUInt8(data[i], offset + i);
    return buf;
}

// TODO: Unhardcode this from ELF32 Big Endian + Segments support
export async function packElf(elf: ELF.File): Promise<Buffer> {
    if (elf.header.class !== ELF.Class.ELF32 || elf.header.endian !== ELF.Endian.Big)
        throw new Error('Only ELF32 Big Endian packing is currently supported.');

    if (elf.header.programHeadersEntryCount !== 0 || /*elf.segments.length !== 0 ||*/ elf.header.programHeadersOffset !== 0)
        console.warn('ELF Segment and program headers packing is not currently supported. Remaining ELF data will still attempt to be packed.');

    let output = Buffer.alloc(elf.header.sectionHeadersOffset + (elf.sections.length * elf.header.sectionHeadersEntrySize));
    packELFHeader(elf).copy(output, 0);
    elf.updateSectionHeaders();
    packELFSectionHeaders(elf).copy(output, elf.header.sectionHeadersOffset);

    const sections = elf.sections.filter(section => section.offset !== 0).sort((a, b) => a.offset - b.offset);
    
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        output = Buffer.concat([output, Buffer.alloc(section.offset - output.byteLength + section.size)]);

        if (section.type === ELF.SectionType.RPLCrcs) {
            (await RPL.packCrcSection(section, elf)).copy(output, section.offset); continue;
        }

        if (RPL.isFileInfoSection(section)) {
            RPL.packFileInfoSection(section).copy(output, section.offset); continue;
        }

        Buffer.from(section.data).copy(output, section.offset);
    }
    
    const align = (output.byteLength + 15 & -16) - output.byteLength;
    if (align !== 0) return Buffer.concat([output, Buffer.alloc(align)]);
    return output;
}

/** Pack the header of an ELF file to binary. */
function packELFHeader(elf: ELF.File): Buffer {
    const header: Buffer = Buffer.alloc(elf.header.headerSize);
    let ix = 0;

    header.write        ('\x7FELF',                           ix); ix += 4;
    header.writeUInt8   (elf.header.class,                    ix); ix += 1;
    header.writeUInt8   (elf.header.endian,                   ix); ix += 1;
    header.writeUInt8   (elf.header.version,                  ix); ix += 1;
    header.writeUInt8   (elf.header.abi,                      ix); ix += 1;
    header.writeUInt8   (elf.header.abiVersion,               ix); ix += 1;
    header.write        ('\0'.repeat(7),                      ix); ix += 7; // Padding
    header.writeUInt16BE(elf.header.type,                     ix); ix += 2;
    header.writeUInt16BE(elf.header.isa,                      ix); ix += 2;
    header.writeUInt32BE(elf.header.isaVersion,               ix); ix += 4;
    header.writeUInt32BE(Number(elf.header.entryPoint),       ix); ix += 4;
    header.writeUInt32BE(elf.header.programHeadersOffset,     ix); ix += 4;
    header.writeUInt32BE(elf.header.sectionHeadersOffset,     ix); ix += 4;
    header.writeUInt32BE(elf.header.flags,                    ix); ix += 4;
    header.writeUInt16BE(elf.header.headerSize,               ix); ix += 2;
    header.writeUInt16BE(elf.header.programHeadersEntrySize,  ix); ix += 2;
    header.writeUInt16BE(elf.header.programHeadersEntryCount, ix); ix += 2;
    header.writeUInt16BE(elf.header.sectionHeadersEntrySize,  ix); ix += 2;
    header.writeUInt16BE(elf.sections.length,                 ix); ix += 2;
    header.writeUInt16BE(elf.header.shstrIndex,               ix); ix += 2;

    return header;
}

/** Pack the section header table of an ELF file to binary. */
export function packELFSectionHeaders(elf: ELF.File): Buffer {
    const sectionHeaders: Buffer = Buffer.alloc(elf.sections.length * elf.header.sectionHeadersEntrySize);
    let ix = 0;

    elf.sections.forEach((section: ELF.Section) => {
        if (section.type === ELF.SectionType.RPLCrcs) section.size = elf.sections.length * section.entSize;

        sectionHeaders.writeUInt32BE(section.nameOffset,   ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.type,         ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.flags,        ix); ix += 4;
        sectionHeaders.writeUInt32BE(Number(section.addr), ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.offset,       ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.size,         ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.link,         ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.info,         ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.addrAlign,    ix); ix += 4;
        sectionHeaders.writeUInt32BE(section.entSize,      ix); ix += 4;
    });

    return sectionHeaders;
}
