/* eslint-env mocha */

import { create as createHashMap, load as loadHashMap } from '../ipld-hashmap.js'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'
import { assert } from 'chai'

const textEncoder = new TextEncoder()

async function toArray (asyncIterator) {
  const result = []
  for await (const item of asyncIterator) {
    result.push(item)
  }
  return result
}

async function execute (options = {}) {
  const expectedEntries = 'foo:bar bar:baz baz:boom'.split(' ').map((e) => e.split(':'))

  const store = {
    map: new Map(),
    get (k) { return store.map.get(k.toString()) },
    put (k, v) { store.map.set(k.toString(), v) }
  }

  const map = await createHashMap(store, Object.assign({ blockHasher, blockCodec }, options))
  await map.set('foo', 'bar')
  await map.set('bar', 'baz')
  await map.set('baz', 'boom')

  await verify(map) // validate the map we just put things into

  const map2 = await loadHashMap(store, map.cid, { blockHasher, blockCodec })

  assert.strictEqual(map2.cid, map.cid, 'CIDs match')

  await verify(map2) // validate a map we've loaded from the backing store

  await map2.delete('bar')
  expectedEntries.splice(1, 1)

  await verify(map2)

  const map3 = await loadHashMap(store, map2.cid, { blockHasher, blockCodec })

  await verify(map3)

  async function verify (map) {
    const entries = await toArray(map.entries())
    assert.sameDeepMembers(entries, expectedEntries, 'entries() returns expected list')

    const entriesRaw = await toArray(map.entriesRaw())
    assert.sameDeepMembers(
      entriesRaw,
      expectedEntries.map((e) => [textEncoder.encode(e[0]), e[1]]),
      'entriesRaw() returns expected list')

    const keys = await toArray(map.keys())
    assert.sameDeepMembers(keys, expectedEntries.map((e) => e[0]), 'keys() returns expected list')

    const keysRaw = await toArray(map.keysRaw())
    assert.sameDeepMembers(
      keysRaw,
      expectedEntries.map((e) => textEncoder.encode(e[0])),
      'keysRaw() returns expected list')

    const values = await toArray(map.values())
    assert.sameDeepMembers(values, expectedEntries.map((e) => e[1]), 'values() returns expected list')

    for (const [key, value] of expectedEntries) {
      assert.ok(await map.has(key))
      assert.strictEqual(await map.get(key, value), value, `get(${key})`)
    }
  }
}

describe('Basics', () => {
  it('simple usage (defaults)', async () => {
    await execute()
  })

  it('simple usage (bitWidth=8)', async () => {
    await execute({ bitWidth: 8 })
  })

  it('simple usage (bitWidth=4)', async () => {
    await execute({ bitWidth: 4 })
  })

  it('simple usage (bucketSize=2)', async () => {
    await execute({ bucketSize: 2 })
  })

  it('simple usage (bucketSize=5)', async () => {
    await execute({ bucketSize: 5 })
  })

  it('simple usage (bitWidth=8, bucketSize=5)', async () => {
    await execute({ bucketSize: 5, bitWidth: 8 })
  })
})
