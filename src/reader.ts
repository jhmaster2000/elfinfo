import { FileHandle } from 'fs/promises';
import * as fs from 'fs';

interface BufferState {
    array?: ArrayBuffer,
    offset: number;
    size: number;
    position: number;
}

function bufferRead(state: BufferState, length: number, position?: number): Promise<Uint8Array> {
    let updatepos = false;
    const { array } = state;

    if (!array) return Promise.reject('state.array must be defined');
    if (!length) return Promise.reject('Length must be specified');

    if (!position) {
        position = state.position;
        updatepos = true;
    }

    if (position <= state.size) {
        if (position + length > state.size) length = state.size - position;
        if (length < 0) length = 0;
        if (updatepos) state.position += length;

        return Promise.resolve(new Uint8Array(array, state.offset + position, length));
    } else {
        return Promise.reject('read past end of file');
    }
}

function createView(from: Uint8Array): DataView {
    return new DataView(from.buffer, from.byteOffset, from.byteLength);
}

/** An abstract interface for a file-reading interface.
  * This is used by the ELF parser to read the file from many different sources. */
export interface Reader {
    /** The path of the file, if it is a file. */
    path?: string,
    /** Called to open the data source asynchronously. */
    open(): Promise<void>;
    /** Called to read data from the data source.
      * @param length The amount of data to read.
      * @param position If specified, seek to this position first. */
    read(length: number, position?: number): Promise<Uint8Array>;
    /** Called to return a data view interface to the data source.
      * @param length The size of the data view.
      * @param position The position of the data view. */
    view(length: number, position?: number): Promise<DataView>;
    /** Returns the size of the data source */
    size(): number;
    /** Closes the data source */
    close(): Promise<void>;
}

export function buffer<TBuffer extends Uint8Array>(buffer: TBuffer | ArrayBuffer): Reader {
    const state: BufferState = {
        array: buffer instanceof Uint8Array ? buffer.buffer : buffer,
        offset: buffer instanceof Uint8Array ? buffer.byteOffset : 0,
        position: 0,
        size: buffer.byteLength
    };

    return {
        open: () => Promise.resolve(),
        size: () => state.size,
        close: () => Promise.resolve(),
        read: (length, position) => bufferRead(state, length, position),
        view: (length, position) => bufferRead(state, length, position).then(createView),
    }
}

export function array(array: number[]): Reader {
    return buffer(Uint8Array.from(array));
}

export async function fileHandle(fh: FileHandle): Promise<Reader> {
    await fh.stat();
    return buffer(await fh.readFile());
}

export function fileDescriptor(handle: number): Reader {
    fs.fstatSync(handle);
    return buffer(fs.readFileSync(handle));
}

export function filePath(path: string): Reader {
    fs.accessSync(path, fs.constants.R_OK);
    return buffer(fs.readFileSync(path));
}

export interface HelperDataView extends DataView {
    readUInt8:  (ix: number) => number;
    readUInt16: (ix: number) => number;
    readUInt32: (ix: number) => number;
    readUInt64: (ix: number) => bigint;
    readSInt8:  (ix: number) => number;
    readSInt16: (ix: number) => number;
    readSInt32: (ix: number) => number;
    readSInt64: (ix: number) => bigint;
}

export function HelperDataView(view: DataView, bigEndian: boolean): HelperDataView {
    (<HelperDataView>view).readUInt8  = view.getUint8.bind(view);
    (<HelperDataView>view).readUInt16 = (ix: number) => view.getUint16(ix, !bigEndian);
    (<HelperDataView>view).readUInt32 = (ix: number) => view.getUint32(ix, !bigEndian);
    (<HelperDataView>view).readUInt64 = (ix: number) => view.getBigUint64(ix, !bigEndian);
    (<HelperDataView>view).readSInt8  = (ix: number) => view.getInt8(ix);
    (<HelperDataView>view).readSInt16 = (ix: number) => view.getInt16(ix, !bigEndian);
    (<HelperDataView>view).readSInt32 = (ix: number) => view.getInt32(ix, !bigEndian);
    (<HelperDataView>view).readSInt64 = (ix: number) => view.getBigInt64(ix, !bigEndian);
    return view as HelperDataView;
}
