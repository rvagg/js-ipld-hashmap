/* eslint-env mocha */

const HashMap = require('../')
const { sha256: blockHasher } = require('multiformats/hashes/sha2')
const blockCodec = require('@ipld/dag-cbor')
const { assert } = require('chai')

async function toArray (asyncIterator) {
  const result = []
  for await (const item of asyncIterator) {
    result.push(item)
  }
  return result
}

describe('Basics', () => {
  it('simple usage', async () => {
    const expectedEntries = 'foo:bar bar:baz baz:boom'.split(' ').map((e) => e.split(':'))

    const store = {
      map: new Map(),
      get (k) { return store.map.get(k.toString()) },
      put (k, v) { store.map.set(k.toString(), v) }
    }

    const map = await HashMap.create(store, { blockHasher, blockCodec })
    await map.set('foo', 'bar')
    await map.set('bar', 'baz')
    await map.set('baz', 'boom')

    await verify(map) // validate the map we just put things into

    const map2 = await HashMap.create(store, map.cid, { blockHasher, blockCodec })

    assert.strictEqual(map2.cid, map.cid, 'CIDs match')

    await verify(map2) // validate a map we've loaded from the backing store

    await map2.delete('bar')
    expectedEntries.splice(1, 1)

    await verify(map2)

    const map3 = await HashMap.create(store, map2.cid, { blockHasher, blockCodec })

    await verify(map3)

    async function verify (map) {
      const entries = await toArray(map.entries())
      assert.sameDeepMembers(entries, expectedEntries, 'entries() returns expected list')

      const keys = await toArray(map.keys())
      assert.sameDeepMembers(keys, expectedEntries.map((e) => e[0]), 'keys() returns expected list')

      const values = await toArray(map.values())
      assert.sameDeepMembers(values, expectedEntries.map((e) => e[1]), 'values() returns expected list')

      for (const [key, value] of expectedEntries) {
        assert.ok(await map.has(key))
        assert.strictEqual(await map.get(key, value), value, `get(${key})`)
      }
    }
  })
})
