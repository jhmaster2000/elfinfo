import * as elfinfo from './index';
import { decode, encode } from './encoding';
import { file, Reader } from './reader';
import { ELFSection, SectionHeaderEntryType, RPLCrcSection, RPLFileInfoSection, RPLFileInfo, PackedELFSection } from './types';

export namespace RPL {
    export async function readCrcSection(fh: Reader, offset: number, size: number, entsize: number, bigEndian: boolean): Promise<number[]> {
        const num = size / entsize;
        const crcs: number[] = [];

        for (let i = 0; i < num; i++) {
            const view = await fh.view(entsize, offset + i * entsize);
            const crc = view.getUint32(0, !bigEndian);
            crcs[i] = crc;
        }

        return crcs;
    }

    export async function readFileInfoSection(fh: Reader, offset: number, size: number, bigEndian: boolean): Promise<RPLFileInfo> {
        if (size < 0x60) throw new Error('RPL_FILEINFO section is too small, must be at least 0x60 in size.');

        const view = await fh.view(0x60, offset);
        const readUint8  = view.getUint8.bind(view);
        const readUInt16 = (ix: number) => view.getUint16(ix, !bigEndian);
        const readUInt32 = (ix: number) => view.getUint32(ix, !bigEndian);
        const readUInt64 = (ix: number) => view.getBigUint64(ix, !bigEndian);
        const readSInt8  = (ix: number) => view.getInt8(ix); //readUint8(ix)  <<  8 >>  8;
        const readSInt16 = (ix: number) => view.getInt16(ix, !bigEndian); //readUInt16(ix) << 16 >> 16;
        const readSInt32 = (ix: number) => view.getInt32(ix, !bigEndian); //readUInt32(ix) <<  0 >> 32;
        const readSInt64 = (ix: number) => view.getBigInt64(ix, !bigEndian); //BigInt.asIntN(64, readUInt64(ix));

        const fileinfo: RPLFileInfo = {} as RPLFileInfo;

        let ix = 0;
        const magic: string = readUInt16(ix).toString(16).toUpperCase();
        if (magic !== 'CAFE') throw new Error(`RPL_FILEINFO section magic number is invalid! Expected "CAFE", got "${magic}"`);

        fileinfo.magic               = magic;          ix += 2;
        fileinfo.version             = readUInt16(ix); ix += 2;
        fileinfo.textSize            = readUInt32(ix); ix += 4;
        fileinfo.textAlign           = readUInt32(ix); ix += 4;
        fileinfo.dataSize            = readUInt32(ix); ix += 4;
        fileinfo.dataAlign           = readUInt32(ix); ix += 4;
        fileinfo.loadSize            = readUInt32(ix); ix += 4;
        fileinfo.loadAlign           = readUInt32(ix); ix += 4;
        fileinfo.tempSize            = readUInt32(ix); ix += 4;
        fileinfo.trampAdjust         = readUInt32(ix); ix += 4;
        fileinfo.sdaBase             = readUInt32(ix); ix += 4;
        fileinfo.sda2Base            = readUInt32(ix); ix += 4;
        fileinfo.stackSize           = readUInt32(ix); ix += 4;
        fileinfo.stringsOffset       = readUInt32(ix); ix += 4;
        fileinfo.flags               = readUInt32(ix); ix += 4;
        fileinfo.heapSize            = readUInt32(ix); ix += 4;
        fileinfo.tagOffset           = readUInt32(ix); ix += 4;
        fileinfo.minVersion          = readUInt32(ix); ix += 4;
        fileinfo.compressionLevel    = readSInt32(ix); ix += 4;
        fileinfo.trampAddition       = readUInt32(ix); ix += 4;
        fileinfo.fileInfoPad         = readUInt32(ix); ix += 4;
        fileinfo.cafeSdkVersion      = readUInt32(ix); ix += 4;
        fileinfo.cafeSdkRevision     = readUInt32(ix); ix += 4;
        fileinfo.tlsModuleIndex      = readUInt16(ix); ix += 2;
        fileinfo.tlsAlignShift       = readUInt16(ix); ix += 2;
        fileinfo.runtimeFileInfoSize = readUInt32(ix); ix += 4;
        fileinfo.strings = [];

        // Section does not have strings
        if (size === 0x60 || size <= fileinfo.stringsOffset) return fileinfo;

        const stringData = await fh.read(size - fileinfo.stringsOffset, offset + fileinfo.stringsOffset);
        const strings: { [addr: number]: string; } = {};

        let strIx = 0;
        for (let i = 0; i < size - fileinfo.stringsOffset; i++) {
            if (stringData[i] == 0) {
                const slen = i - strIx;
                if (slen > 0) strings[strIx + fileinfo.stringsOffset] = decode(stringData, strIx, slen);
                if (slen === 0) strings[strIx + fileinfo.stringsOffset] = '';
                strIx = i + 1;
            }
        }
        fileinfo.strings = strings;

        return fileinfo;
    }

    export function isCrcSection(section: ELFSection): section is RPLCrcSection {
        return section.type === SectionHeaderEntryType.RPLCrcs;
    }

    export function isFileInfoSection(section: ELFSection): section is RPLFileInfoSection {
        return section.type === SectionHeaderEntryType.RPLFileInfo;
    }

    export function packCrcSection(section: RPLCrcSection): PackedELFSection {
        const databuf = Buffer.alloc(section.size);
        let ix = 0;

        for (const crc of section.crcs) { writeBufferToBuffer(databuf, encode(crc, 4), ix); ix += 4; }

        return {
            headerIndex: section.index,
            dataOffset: section.offset,
            data: databuf
        }
    }

    export function packFileInfoSection(section: RPLFileInfoSection): PackedELFSection {
        const databuf = Buffer.alloc(section.size);
        let ix = 0;
        writeBufferToBuffer(databuf, encode(parseInt(section.fileinfo.magic, 16), 2), ix); ix += 2;
        writeBufferToBuffer(databuf, encode(section.fileinfo.version, 2), ix); ix += 2;
        writeBufferToBuffer(databuf, encode(section.fileinfo.textSize, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.textAlign, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.dataSize, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.dataAlign, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.loadSize, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.loadAlign, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.tempSize, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.trampAdjust, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.sdaBase, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.sda2Base, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.stackSize, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.stringsOffset, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.flags, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.heapSize, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.tagOffset, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.minVersion, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.compressionLevel, 4, true), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.trampAddition, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.fileInfoPad, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.cafeSdkVersion, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.cafeSdkRevision, 4), ix); ix += 4;
        writeBufferToBuffer(databuf, encode(section.fileinfo.tlsModuleIndex, 2), ix); ix += 2;
        writeBufferToBuffer(databuf, encode(section.fileinfo.tlsAlignShift, 2), ix); ix += 2;
        writeBufferToBuffer(databuf, encode(section.fileinfo.runtimeFileInfoSize, 4), ix); ix += 4;

        for (let key in section.fileinfo.strings) {
            const addr = Number(key);
            const str = section.fileinfo.strings[key];
            const encoded = encode(str);
            writeBufferToBuffer(databuf, encoded, ix); ix += encoded.byteLength;
            writeBufferToBuffer(databuf, encode('\0'), ix); ix += 1;
        }

        return {
            headerIndex: section.index,
            dataOffset: section.offset,
            data: databuf
        };
    }
}

export function writeBufferToBuffer(buf: Buffer, data: Buffer, offset: number): Buffer {
    //console.log('writebuf called:', data);
    if ((offset + data.byteLength) > buf.byteLength) throw new Error('Cannot write outside destination buffer size.');
    if (offset < 0) throw new Error('Offset must be greater than zero.');
    for (let i = 0; i < data.byteLength; i++) buf.writeUInt8(data[i], offset + i);
    return buf;
}
