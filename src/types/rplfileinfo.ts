import assert from 'assert';
import { uint16, uint32, sint32 } from './primitive.js';
import { Structs } from './structs.js';

export class RPLFileInfo extends Structs.RPLFileInfo {
    constructor() { super(); }

    get version(): uint16 { return this._version }
    get textSize(): uint32 { return this._textSize }
    get textAlign(): uint32 { return this._textAlign }
    get dataSize(): uint32 { return this._dataSize }
    get dataAlign(): uint32 { return this._dataAlign }
    get loadSize(): uint32 { return this._loadSize }
    get loadAlign(): uint32 { return this._loadAlign }
    get tempSize(): uint32 { return this._tempSize }
    get trampAdjust(): uint32 { return this._trampAdjust }
    get sdaBase(): uint32 { return this._sdaBase }
    get sda2Base(): uint32 { return this._sda2Base }
    get stackSize(): uint32 { return this._stackSize }
    /** The offset from the start of the section to the start of the strings array */
    get stringsOffset(): uint32 { return this._stringsOffset }
    get flags(): uint32 { return this._flags }
    get heapSize(): uint32 { return this._heapSize }
    get tagOffset(): uint32 { return this._tagOffset }
    get minVersion(): uint32 { return this._minVersion }
    get compressionLevel(): sint32 { return this._compressionLevel }
    get trampAddition(): uint32 { return this._trampAddition }
    get fileInfoPad(): uint32 { return this._fileInfoPad }
    get cafeSdkVersion(): uint32 { return this._cafeSdkVersion }
    get cafeSdkRevision(): uint32 { return this._cafeSdkRevision }
    get tlsModuleIndex(): uint16 { return this._tlsModuleIndex }
    get tlsAlignShift(): uint16 { return this._tlsAlignShift }
    get runtimeFileInfoSize(): uint32 { return this._runtimeFileInfoSize }
    /** Array of null-terminated strings until the end of the file */
    get strings(): { [addr: number]: string; } { return this._strings }

    set version(version: uint16) {
        assert(version >= 0x00 && 0xFFFF >= version, `${version} does not fit inside a uint16.`);
        this._version = version;
    }
    set textSize(textSize: uint32) {
        assert(textSize >= 0x00 && 0xFFFFFFFF >= textSize, `${textSize} does not fit inside a uint32.`);
        this._textSize = textSize;
    }
    set textAlign(textAlign: uint32) {
        assert(textAlign >= 0x00 && 0xFFFFFFFF >= textAlign, `${textAlign} does not fit inside a uint32.`);
        this._textAlign = textAlign;
    }
    set dataSize(dataSize: uint32) {
        assert(dataSize >= 0x00 && 0xFFFFFFFF >= dataSize, `${dataSize} does not fit inside a uint32.`);
        this._dataSize = dataSize;
    }
    set dataAlign(dataAlign: uint32) {
        assert(dataAlign >= 0x00 && 0xFFFFFFFF >= dataAlign, `${dataAlign} does not fit inside a uint32.`);
        this._dataAlign = dataAlign;
    }
    set loadSize(loadSize: uint32) {
        assert(loadSize >= 0x00 && 0xFFFFFFFF >= loadSize, `${loadSize} does not fit inside a uint32.`);
        this._loadSize = loadSize;
    }
    set loadAlign(loadAlign: uint32) {
        assert(loadAlign >= 0x00 && 0xFFFFFFFF >= loadAlign, `${loadAlign} does not fit inside a uint32.`);
        this._loadAlign = loadAlign;
    }
    set tempSize(tempSize: uint32) {
        assert(tempSize >= 0x00 && 0xFFFFFFFF >= tempSize, `${tempSize} does not fit inside a uint32.`);
        this._tempSize = tempSize;
    }
    set trampAdjust(trampAdjust: uint32) {
        assert(trampAdjust >= 0x00 && 0xFFFFFFFF >= trampAdjust, `${trampAdjust} does not fit inside a uint32.`);
        this._trampAdjust = trampAdjust;
    }
    set sdaBase(sdaBase: uint32) {
        assert(sdaBase >= 0x00 && 0xFFFFFFFF >= sdaBase, `${sdaBase} does not fit inside a uint32.`);
        this._sdaBase = sdaBase;
    }
    set sda2Base(sda2Base: uint32) {
        assert(sda2Base >= 0x00 && 0xFFFFFFFF >= sda2Base, `${sda2Base} does not fit inside a uint32.`);
        this._sda2Base = sda2Base;
    }
    set stackSize(stackSize: uint32) {
        assert(stackSize >= 0x00 && 0xFFFFFFFF >= stackSize, `${stackSize} does not fit inside a uint32.`);
        this._stackSize = stackSize;
    }
    set stringsOffset(stringsOffset: uint32) {
        assert(stringsOffset >= 0x00 && 0xFFFFFFFF >= stringsOffset, `${stringsOffset} does not fit inside a uint32.`);
        this._stringsOffset = stringsOffset;
    }
    set flags(flags: uint32) {
        assert(flags >= 0x00 && 0xFFFFFFFF >= flags, `${flags} does not fit inside a uint32.`);
        this._flags = flags;
    }
    set heapSize(heapSize: uint32) {
        assert(heapSize >= 0x00 && 0xFFFFFFFF >= heapSize, `${heapSize} does not fit inside a uint32.`);
        this._heapSize = heapSize;
    }
    set tagOffset(tagOffset: uint32) {
        assert(tagOffset >= 0x00 && 0xFFFFFFFF >= tagOffset, `${tagOffset} does not fit inside a uint32.`);
        this._tagOffset = tagOffset;
    }
    set minVersion(minVersion: uint32) {
        assert(minVersion >= 0x00 && 0xFFFFFFFF >= minVersion, `${minVersion} does not fit inside a uint32.`);
        this._minVersion = minVersion;
    }
    set compressionLevel(compressionLevel: sint32) {
        assert(compressionLevel >= -0x80000000 && 0x7FFFFFFF >= compressionLevel, `${compressionLevel} does not fit inside a sint32.`);
        this._compressionLevel = compressionLevel;
    }
    set trampAddition(trampAddition: uint32) {
        assert(trampAddition >= 0x00 && 0xFFFFFFFF >= trampAddition, `${trampAddition} does not fit inside a uint32.`);
        this._trampAddition = trampAddition;
    }
    set fileInfoPad(fileInfoPad: uint32) {
        assert(fileInfoPad >= 0x00 && 0xFFFFFFFF >= fileInfoPad, `${fileInfoPad} does not fit inside a uint32.`);
        this._fileInfoPad = fileInfoPad;
    }
    set cafeSdkVersion(cafeSdkVersion: uint32) {
        assert(cafeSdkVersion >= 0x00 && 0xFFFFFFFF >= cafeSdkVersion, `${cafeSdkVersion} does not fit inside a uint32.`);
        this._cafeSdkVersion = cafeSdkVersion;
    }
    set cafeSdkRevision(cafeSdkRevision: uint32) {
        assert(cafeSdkRevision >= 0x00 && 0xFFFFFFFF >= cafeSdkRevision, `${cafeSdkRevision} does not fit inside a uint32.`);
        this._cafeSdkRevision = cafeSdkRevision;
    }
    set tlsModuleIndex(tlsModuleIndex: uint16) {
        assert(tlsModuleIndex >= 0x00 && 0xFFFF >= tlsModuleIndex, `${tlsModuleIndex} does not fit inside a uint16.`);
        this._tlsModuleIndex = tlsModuleIndex;
    }
    set tlsAlignShift(tlsAlignShift: uint16) {
        assert(tlsAlignShift >= 0x00 && 0xFFFF >= tlsAlignShift, `${tlsAlignShift} does not fit inside a uint16.`);
        this._tlsAlignShift = tlsAlignShift;
    }
    set runtimeFileInfoSize(runtimeFileInfoSize: uint32) {
        assert(runtimeFileInfoSize >= 0x00 && 0xFFFFFFFF >= runtimeFileInfoSize, `${runtimeFileInfoSize} does not fit inside a uint32.`);
        this._runtimeFileInfoSize = runtimeFileInfoSize;
    }
    set strings(strings: { [addr: number]: string; }) { this._strings = strings; } // TODO: Strings validation
}
