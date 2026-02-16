import { CID } from 'multiformats/cid'
import { BlockCodec } from 'multiformats/codecs/interface'
import { MultihashHasher } from 'multiformats/hashes/interface'

export interface SignalOptions {
  signal?: AbortSignal
}

export interface HashMap<V> {
  readonly cid: CID

  get (key: string | Uint8Array, options?: SignalOptions): Promise<V|void>

  has (key: string | Uint8Array, options?: SignalOptions): Promise<boolean>

  size (options?: SignalOptions): Promise<number>

  set (key: string | Uint8Array, value: V, options?: SignalOptions): Promise<void>

  delete (key: string | Uint8Array, options?: SignalOptions): Promise<void>

  values (options?: SignalOptions): AsyncIterable<V>

  keys (options?: SignalOptions): AsyncIterable<string>

  keysRaw (options?: SignalOptions): AsyncIterable<Uint8Array>

  entries (options?: SignalOptions): AsyncIterable<[string, V]>

  entriesRaw (options?: SignalOptions): AsyncIterable<[Uint8Array, V]>

  cids (options?: SignalOptions): AsyncIterable<CID>
}

export interface CreateOptions<Codec extends number, V> {
  blockCodec: BlockCodec<Codec, V>

  blockHasher: MultihashHasher

  hasher?: MultihashHasher

  hashBytes?: number

  bitWidth?: number

  bucketSize?: number
}

export interface Loader {
  get (cid: CID, options?: SignalOptions): Promise<Uint8Array>
  put (cid: CID, bytes: Uint8Array, options?: SignalOptions): Promise<void>
}
