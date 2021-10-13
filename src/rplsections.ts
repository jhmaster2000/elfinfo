import * as elfinfo from './index';
import { decode } from './encoding';
import { file, Reader } from './reader';
import { ELFSection, SectionHeaderEntryType, RPLCrcSection, RPLFileInfoSection, RPLFileInfo } from './types';

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

    export function packFileInfoSection() {

    }
}
