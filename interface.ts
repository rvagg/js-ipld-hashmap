import { CID } from 'multiformats/cid'
import { BlockCodec } from 'multiformats/codecs/interface'
import { MultihashHasher } from 'multiformats/hashes/interface'

export interface HashMap<V> {
  readonly cid: CID

  get (key: string): Promise<V|void>

  has (key: string): Promise<boolean>

  size (): Promise<number>

  set (key: string, value: V): Promise<void>

  delete (key: string): Promise<void>

  values (): AsyncIterator<V>

  keys (): AsyncIterator<string>

  entries (): AsyncIterator<[string, V]>

  cids (): AsyncIterator<CID>
}

export interface CreateOptions<Codec extends number, V> {
  blockCodec: BlockCodec<Codec, V>

  blockHasher: MultihashHasher

  hasher: MultihashHasher

  hashBytes: number

  bitWidth: number

  bucketSize: number
}

export interface Loader {
  get (cid: CID): Promise<Uint8Array>
  put (cid: CID, bytes: Uint8Array): Promise<void>
}
