/* eslint-env mocha */

import { create as createHashMap, load as loadHashMap } from '../ipld-hashmap.js'
import { CID } from 'multiformats/cid'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const { assert } = chai

describe('Errors', () => {
  it('create() errors', async () => {
    const dummyLoader = { get () {}, put () {} }
    await assert.isRejected(createHashMap(), '\'loader\' object with get() and put() methods is required')
    await assert.isRejected(createHashMap({}), '\'loader\' object with get() and put() methods is required')
    await assert.isRejected(createHashMap({ get: () => {} }), '\'loader\' object with get() and put() methods is required')
    await assert.isRejected(createHashMap(dummyLoader, 100), '\'options\' argument is required')
    await assert.isRejected(createHashMap(dummyLoader, { }), '\'blockCodec\' option')
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec: {} }), '\'blockCodec\' option')
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec: false }), '\'blockCodec\' option')
    const blockCodec = { code: 1, encode: () => {}, decode: () => {} }
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec }), '\'blockHasher\' option')
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec, blockHasher: false }), '\'blockHasher\' option')
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec, blockHasher: {} }), '\'blockHasher\' option')
    const blockHasher = { code: 2, digest: () => {} }
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec, blockHasher, hasher: false }), '\'hasher\' option')
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec, blockHasher, hasher: {} }), '\'hasher\' option')
    const hasher = blockHasher
    await assert.isRejected(createHashMap(dummyLoader, { blockCodec, blockHasher, hasher, hashBytes: false }), '\'hashBytes\' option')
  })

  it('CID load mismatch', async () => {
    const store = {
      get () {
        return Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) // "random" bytes
      },
      put () { }
    }

    const hash = await blockHasher.digest(new TextEncoder().encode('blorp'))
    const cid = CID.create(1, blockCodec.code, hash) // just a random CID
    await assert.isRejected(loadHashMap(store, cid, { blockCodec, blockHasher }), 'decode error')
  })

  it('non-storing store', async () => {
    const store = {
      get () { },
      put () { }
    }

    const hash = await blockHasher.digest(new TextEncoder().encode('blorp'))
    const cid = CID.create(1, blockCodec.code, hash) // just a random CID
    await assert.isRejected(loadHashMap(store, cid, { blockCodec, blockHasher })) // , 'bad loader rejects')
  })

  it('bad serialization', async () => {
    const bytes = blockCodec.encode({ not: 'a', proper: 'hamt' })
    const hash = await blockHasher.digest(bytes)
    const cid = CID.create(1, blockCodec.code, hash)

    const store = {
      get () {
        return bytes
      },
      put () { }
    }

    await assert.isRejected(loadHashMap(store, cid, { blockCodec, blockHasher }), 'unexpected layout for HashMap block does not match schema')
  })
})
