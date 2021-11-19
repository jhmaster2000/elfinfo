
// pretend that we have node
declare var require: (id: string) => any;

interface StringDecoder {
    write(buffer: Uint8Array): string;
    end(buffer?: Uint8Array): string;
}

// pretend we have browser
interface TextDecoder {
    decode(input?: any, options?: any): string;
}
declare var TextDecoder: {
    prototype: TextDecoder;
    new(label?: string, options?: any): TextDecoder;
};

/** cross-environment utf-8 decode */
let _decode: ((array: Uint8Array, offset: number, length: number) => string) | undefined;
export function decode(array: Uint8Array, offset: number, length: number): string {
    if (_decode) {
        return _decode(array, offset, length);
    } else {
        throw new Error('There is no supported utf-8 decoder');
    }
}

if (typeof require !== undefined) {
    let decoder: StringDecoder | undefined;
    try {
        const { StringDecoder } = require('string_decoder') as { StringDecoder: any };
        const decoder = new StringDecoder('utf8') as StringDecoder;
        if (decoder) {
            _decode = (array: Uint8Array, offset: number, length: number) => {
                return decoder.end(array.subarray(offset, offset + length));
            }
        }
    } catch (e) {}
}

if (_decode === undefined && typeof TextDecoder !== 'undefined') {
    const decoder = new TextDecoder();
    _decode = (array: Uint8Array, offset: number, length: number) => {
        return decoder.decode(array.subarray(offset, offset + length));
    }
}

function toHexSInt(bits: number, number: number): string {
    if (number < 0) number = ((0x100 ** (bits / 8)) - 1) + number + 1;
    return number.toString(16).toUpperCase();
}

export function encode(input: string | number, bytesAlign: number = 0, signed: boolean = false, encoding: BufferEncoding = 'utf-8'): Buffer {
    if (typeof input === 'string') return encodeString(input, encoding);
    if (typeof input === 'number') return encodeNumber(Math.floor(input), Math.floor(bytesAlign), signed);
    throw new Error('Unexpected input type "' + typeof input + '".');
}

function encodeString(string: string, encoding: BufferEncoding = 'utf-8'): Buffer {
    return Buffer.from(string, encoding);
}

function encodeNumber(number: number, bytesAlign: number = 0, signed: boolean = false): Buffer {
    if (!signed) number = Math.abs(number);
    const tmpstr: string = signed ? toHexSInt((bytesAlign * 8) || 8, number) : number.toString(16);
    return Buffer.from(tmpstr.padStart(tmpstr.length + Number(tmpstr.length % 2 !== 0), '0').padStart(bytesAlign * 2, '0'), 'hex');
}

//function decodeString(buffer: Buffer, offset: number, length: number, encoding: BufferEncoding = 'utf-8'): string {
//    return buffer.toString(encoding, offset, offset + length);
//}
//
//function decodeNumber(buffer: Buffer, offset: number, length: number, signed: boolean = false): number {
//    const tmpstr: string = buffer.toString('hex', offset, offset + length);
//    return signed ? parseInt(tmpstr, 16) : parseInt(tmpstr, 16);
//}

export function trimBuffer(buf: ArrayBufferView, offset?: number, length?: number): ArrayBuffer;
export function trimBuffer(buf: ArrayBuffer, offset: number, length?: number): ArrayBuffer;
export function trimBuffer(buf: ArrayBufferView | ArrayBuffer, offset: number = 0, length: number = buf.byteLength): ArrayBuffer {
    if (buf instanceof ArrayBuffer) return buf.slice(offset, offset + length);
    return buf.buffer.slice(buf.byteOffset + offset, buf.byteOffset + offset + length);
}
