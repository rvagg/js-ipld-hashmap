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

function trackingStore () {
  const store = {
    map: new Map(),
    getSignals: [],
    putSignals: [],
    get (k, options) {
      store.getSignals.push(options && options.signal)
      return store.map.get(k.toString())
    },
    put (k, v, options) {
      store.putSignals.push(options && options.signal)
      store.map.set(k.toString(), v)
    }
  }
  return store
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

describe('AbortSignal', () => {
  // Use bucketSize=2 (minimum) to force child nodes with fewer entries
  const sigOpts = { blockHasher, blockCodec, bucketSize: 2 }

  async function populatedMap (store) {
    const map = await createHashMap(store, sigOpts)
    // Enough entries to guarantee child nodes with bucketSize=2
    for (let i = 0; i < 50; i++) {
      await map.set(`key${i}`, `value${i}`)
    }
    return map
  }

  it('signal is forwarded to loader.get and loader.put', async () => {
    const store = trackingStore()
    const ac = new AbortController()
    const map = await populatedMap(store)

    store.putSignals.length = 0
    await map.set('extra', 'val', { signal: ac.signal })
    assert.ok(store.putSignals.some((s) => s === ac.signal), 'signal forwarded to put()')

    // Reload from CID so child nodes must be loaded from store
    const map2 = await loadHashMap(store, map.cid, sigOpts)
    store.getSignals.length = 0
    await map2.get('key0', { signal: ac.signal })
    assert.ok(store.getSignals.some((s) => s === ac.signal), 'signal forwarded to get()')
  })

  it('pre-aborted signal throws on set, get, has, delete, size', async () => {
    const store = trackingStore()
    const map = await populatedMap(store)

    const signal = AbortSignal.abort()

    const ops = [
      map.set('x', 'y', { signal }),
      map.get('key0', { signal }),
      map.has('key0', { signal }),
      map.delete('key0', { signal }),
      map.size({ signal })
    ]
    for (const op of ops) {
      try {
        await op
        assert.fail('expected throw')
      } catch (err) {
        assert.strictEqual(err.name, 'AbortError')
      }
    }
  })

  it('pre-aborted signal aborts iterators during traversal', async () => {
    const store = trackingStore()
    const map = await populatedMap(store)

    // Reload so child nodes require store.load during iteration
    const map2 = await loadHashMap(store, map.cid, sigOpts)
    const signal = AbortSignal.abort()

    // Iterators may yield entries from the already-loaded root bucket
    // before hitting a child node traversal that checks the signal.
    // Verify that iteration is aborted before all entries are yielded.
    const iterators = [
      map2.values({ signal }),
      map2.keys({ signal }),
      map2.keysRaw({ signal }),
      map2.entries({ signal }),
      map2.entriesRaw({ signal }),
      map2.cids({ signal })
    ]
    for (const iter of iterators) {
      let count = 0
      try {
        for await (const _ of iter) { // eslint-disable-line no-unused-vars
          count++
        }
        assert.fail('expected throw')
      } catch (err) {
        assert.strictEqual(err.name, 'AbortError')
        // Confirm iteration was cut short (50 entries in map, plus CIDs for cids())
        assert.ok(count < 50, `only yielded ${count} items before abort`)
      }
    }
  })
})
