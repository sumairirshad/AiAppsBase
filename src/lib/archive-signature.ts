import { Transform } from 'stream'
import { createHash } from 'crypto'

/** Thrown when a stream's actual content doesn't match a real ZIP or RAR archive. */
export class InvalidArchiveSignatureError extends Error {}

const ZIP_SIGNATURES = [
  Buffer.from([0x50, 0x4b, 0x03, 0x04]), // local file header (normal, non-empty archive)
  Buffer.from([0x50, 0x4b, 0x05, 0x06]), // end of central directory (empty archive)
  Buffer.from([0x50, 0x4b, 0x07, 0x08]), // spanned archive
]
const RAR_SIGNATURES = [
  Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]), // RAR 1.5-4.x
  Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00]), // RAR 5.0+
]
const HEADER_BYTES_NEEDED = Math.max(...ZIP_SIGNATURES.map((s) => s.length), ...RAR_SIGNATURES.map((s) => s.length))

function matchesKnownArchiveSignature(header: Buffer): boolean {
  const all = [...ZIP_SIGNATURES, ...RAR_SIGNATURES]
  return all.some((sig) => header.length >= sig.length && header.subarray(0, sig.length).equals(sig))
}

/**
 * A passthrough stream that validates a file's *actual bytes* against the
 * real ZIP/RAR magic numbers — not just its extension or the browser-
 * supplied MIME type, both of which a client fully controls (AUD finding:
 * the previous upload path accepted any file whose name ended in .zip/.rar).
 *
 * Only the first few bytes are ever held in memory; everything after that
 * (however large the archive is) streams straight through unchanged, so
 * this never buffers the file itself. Emits InvalidArchiveSignatureError
 * (destroying the stream) as soon as the header is known to be invalid, or
 * if the stream ends before a full header ever arrived.
 */
export function createArchiveSignatureValidator(): Transform {
  let header: Buffer | null = Buffer.alloc(0)

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      if (header === null) {
        callback(null, chunk)
        return
      }
      header = Buffer.concat([header, chunk])
      if (header.length < HEADER_BYTES_NEEDED) {
        callback()
        return
      }
      if (!matchesKnownArchiveSignature(header)) {
        callback(new InvalidArchiveSignatureError('The uploaded file is not a valid ZIP or RAR archive.'))
        return
      }
      const flushed = header
      header = null
      callback(null, flushed)
    },
    flush(callback) {
      if (header !== null) {
        callback(new InvalidArchiveSignatureError('The uploaded file is too small to be a valid ZIP or RAR archive.'))
        return
      }
      callback()
    },
  })
}

/**
 * A passthrough stream that counts bytes and computes a running SHA-256
 * digest as data flows through, for post-upload integrity verification
 * (comparing against what the remote storage server reports it received)
 * without ever holding the file's content itself in memory.
 */
export class ByteCounterHasher extends Transform {
  bytes = 0
  private hash = createHash('sha256')

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null, data?: Buffer) => void) {
    this.bytes += chunk.length
    this.hash.update(chunk)
    callback(null, chunk)
  }

  digestHex(): string {
    return this.hash.digest('hex')
  }
}
