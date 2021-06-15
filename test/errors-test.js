/* eslint-env mocha */

const { CID } = require('multiformats/cid')
const { sha256: blockHasher } = require('multiformats/hashes/sha2')
const blockCodec = require('@ipld/dag-cbor')
const HashMap = require('../')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const { assert } = chai

describe('Errors', () => {
  it('create() errors', async () => {
    const dummyLoader = { get () {}, put () {} }
    await assert.isRejected(HashMap.create(), 'requires a loader object')
    await assert.isRejected(HashMap.create({}), 'requires a loader object')
    await assert.isRejected(HashMap.create({ get: () => {} }), 'requires a loader object')
    await assert.isRejected(HashMap.create(dummyLoader, 100), '\'options\' argument must be an object')
    await assert.isRejected(HashMap.create(dummyLoader, { hashAlg: 'woop' }), 'requires a \'blockCodec\' option')
    await assert.isRejected(HashMap.create(dummyLoader, { hashAlg: 'woop', blockCodec: {} }), 'requires a \'blockHasher\' option')
    await assert.isRejected(HashMap.create(dummyLoader, { blockCodec: false }), 'requires the \'blockCodec\' option to be a object')
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
    await assert.isRejected(HashMap.create(store, cid, { blockCodec, blockHasher }), 'decode error')
  })

  it('non-storing store', async () => {
    const store = {
      get () { },
      put () { }
    }

    const hash = await blockHasher.digest(new TextEncoder().encode('blorp'))
    const cid = CID.create(1, blockCodec.code, hash) // just a random CID
    await assert.isRejected(HashMap.create(store, cid, { blockCodec, blockHasher })) // , 'bad loader rejects')
  })
})
