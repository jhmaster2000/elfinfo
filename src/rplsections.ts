import { decode, encode } from './encoding.js';
import { file, HelperDataView, Reader } from './reader.js';
import * as ELF from './types/index.js';
import { writeBufferToBuffer } from './writer.js';

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

    export async function readFileInfoSection(fh: Reader, offset: number, size: number, bigEndian: boolean): Promise<ELF.RPLFileInfo> {
        if (size < 0x60) throw new Error('RPL_FILEINFO section is too small, must be at least 0x60 in size.');

        const view = HelperDataView(await fh.view(0x60, offset), bigEndian);
        const fileinfo: ELF.RPLFileInfo = new ELF.RPLFileInfo();

        let ix = 0;
        const magic: string = view.readUInt16(ix).toString(16).toUpperCase();
        if (magic !== 'CAFE') throw new Error(`RPL_FILEINFO section magic number is invalid! Expected "CAFE", got "${magic}"`);

        /*fileinfo.magic             = magic;*/        ix += 2;
        fileinfo.version             = view.readUInt16(ix); ix += 2;
        fileinfo.textSize            = view.readUInt32(ix); ix += 4;
        fileinfo.textAlign           = view.readUInt32(ix); ix += 4;
        fileinfo.dataSize            = view.readUInt32(ix); ix += 4;
        fileinfo.dataAlign           = view.readUInt32(ix); ix += 4;
        fileinfo.loadSize            = view.readUInt32(ix); ix += 4;
        fileinfo.loadAlign           = view.readUInt32(ix); ix += 4;
        fileinfo.tempSize            = view.readUInt32(ix); ix += 4;
        fileinfo.trampAdjust         = view.readUInt32(ix); ix += 4;
        fileinfo.sdaBase             = view.readUInt32(ix); ix += 4;
        fileinfo.sda2Base            = view.readUInt32(ix); ix += 4;
        fileinfo.stackSize           = view.readUInt32(ix); ix += 4;
        fileinfo.stringsOffset       = view.readUInt32(ix); ix += 4;
        fileinfo.flags               = view.readUInt32(ix); ix += 4;
        fileinfo.heapSize            = view.readUInt32(ix); ix += 4;
        fileinfo.tagOffset           = view.readUInt32(ix); ix += 4;
        fileinfo.minVersion          = view.readUInt32(ix); ix += 4;
        fileinfo.compressionLevel    = view.readSInt32(ix); ix += 4;
        fileinfo.trampAddition       = view.readUInt32(ix); ix += 4;
        fileinfo.fileInfoPad         = view.readUInt32(ix); ix += 4;
        fileinfo.cafeSdkVersion      = view.readUInt32(ix); ix += 4;
        fileinfo.cafeSdkRevision     = view.readUInt32(ix); ix += 4;
        fileinfo.tlsModuleIndex      = view.readUInt16(ix); ix += 2;
        fileinfo.tlsAlignShift       = view.readUInt16(ix); ix += 2;
        fileinfo.runtimeFileInfoSize = view.readUInt32(ix); ix += 4;
        fileinfo.strings = [];

        // Section does not have strings
        if (size === 0x60 || size <= fileinfo.stringsOffset) return fileinfo;

        const stringData = await fh.read(size - fileinfo.stringsOffset, offset + fileinfo.stringsOffset);
        const strings: { [addr: number]: string; } = {};

        let strIx = 0;
        for (let i = 0; i < size - fileinfo.stringsOffset; i++) {
            if (stringData[i] === 0) {
                const slen = i - strIx;
                if (slen > 0) strings[strIx + fileinfo.stringsOffset] = decode(stringData, strIx, slen);
                if (slen === 0) strings[strIx + fileinfo.stringsOffset] = '';
                strIx = i + 1;
            }
        }
        fileinfo.strings = strings;

        return fileinfo;
    }

    export function isCrcSection(section: ELF.Section): section is ELF.RPLCrcSection {
        return section.type === ELF.SectionType.RPLCrcs;
    }

    export function isFileInfoSection(section: ELF.Section): section is ELF.RPLFileInfoSection {
        return section.type === ELF.SectionType.RPLFileInfo;
    }

    export function packCrcSection(section: ELF.RPLCrcSection): Buffer {
        const databuf = Buffer.alloc(section.size);
        let ix = 0;

        for (const crc of section.crcs) { writeBufferToBuffer(databuf, encode(crc, 4), ix); ix += 4; }

        return databuf;
    }

    export function packFileInfoSection(section: ELF.RPLFileInfoSection): Buffer {
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
            //const addr = Number(key);
            const str = section.fileinfo.strings[key];
            const encoded = encode(str);
            writeBufferToBuffer(databuf, encoded, ix); ix += encoded.byteLength;
            writeBufferToBuffer(databuf, encode('\0'), ix); ix += 1;
        }

        return databuf;
    }
}
