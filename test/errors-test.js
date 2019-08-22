const crypto = require('crypto')
const HashMap = require('../')
const tap = require('tap')
const CID = require('cids')
const multihashing = require('multihashing-async')

tap.test('create() errors', async (t) => {
  const dummyLoader = { get () {}, put () {} }
  t.rejects(HashMap.create(), 'empty create(), no loader')
  t.rejects(HashMap.create({}), 'create() with useless loader')
  t.rejects(HashMap.create({ get: () => {} }), 'create() with only get()')
  t.rejects(HashMap.create(dummyLoader, 100), 'create() with bad options object')
  t.rejects(HashMap.create(dummyLoader, { hashAlg: 'woop' }), 'create() hashAlg but no hasher or hashBytes')
  t.rejects(HashMap.create(dummyLoader, { hashAlg: 'woop', hasher () {} }), 'create() hashAlg and hasher but no hashBytes')
  t.rejects(HashMap.create(dummyLoader, { blockCodec: false }), 'create() bad coded type')
})

tap.test('CID load mismatch', async (t) => {
  const store = {
    get () {
      return crypto.randomBytes(256)
    },
    put () { }
  }

  const hash = await multihashing('blorp', 'sha2-256')
  const cid = new CID(1, 'dag-cbor', hash) // just a random CID
  t.rejects(HashMap.create(store, cid), 'bad loader rejects')
})

tap.test('non-storing store', async (t) => {
  const store = {
    get () { },
    put () { }
  }

  const hash = await multihashing('blorp', 'sha2-256')
  const cid = new CID(1, 'dag-cbor', hash) // just a random CID
  t.rejects(HashMap.create(store, cid), 'bad loader rejects')
})
