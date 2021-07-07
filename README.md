# js-ipld-hashmap

**An associative array Map-type data structure for very large, distributed data sets built on [IPLD](http://ipld.io/).**

[![NPM](https://nodei.co/npm/ipld-hashmap.svg)](https://nodei.co/npm/ipld-hashmap/)

This JavaScript implementation conforms to the [IPLD HashMap specification](https://github.com/ipld/specs/blob/master/schema-layer/data-structures/hashmap.md).

The `HashMap` in this implementation has an API similar to JavaScript's native [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) object but uses asynchronous accessors rather than synchronous. When creating a new `HashMap` or loading one with existing data, a backing store must be provided. The backing store is provided via a `loader` interface which should have a `get()` method that returns binary IPLD block data when provided a [CID](https://github.com/multiformats/js-cid) (content identifier) and a `put()` method that takes both a CID and binary block data that will store the IPLD block. This interface may connect to a P2P network, a block storage database or even a [ZIP file](https://github.com/rvagg/js-ds-zipcar).

The algorithm for this HashMap is implemented in [IAMap](https://github.com/rvagg/iamap), you can read more about it there, or in the [IPLD HashMap specification](https://github.com/ipld/specs/blob/master/schema-layer/data-structures/hashmap.md). IAMap is serialization and storage agnostic and therefore does not contain any IPLD dependencies. IAMap is also immutable, where each mutation operation returns a _new_ instance.

This implementation wraps IAMap with IPLD primitives, including the use of CIDs and the standard [IPLD block encoding](https://github.com/ipld/js-block) formats and presents a mutable interface. Each `HashMap` object has its own root CID in the `cid` property. Whenever the `HashMap` is mutated (`get()` and `delete()`), the `cid` property will change to the new root block CID.

You can create a new, empty, `HashMap` with [`async HashMap.create(loader[, options])`](#HashMap__create). Loading a `HashMap` from existing data can be done with [`async HashMap.create(loader[, root][, options])`](#HashMap__create).

Be aware that each mutation operation will create at least one new block, stored via `loader.put()`. Large numbers of mutations will create many extraneous intermediate blocks which will need to be garbage collected from the backing store if the intermediate states are not required.

## API

### Contents

 * [`class HashMap`](#HashMap)
 * [`async HashMap#get(key)`](#HashMap_get)
 * [`async HashMap#has(key)`](#HashMap_has)
 * [`async HashMap#size()`](#HashMap_size)
 * [`async HashMap#set(key, value)`](#HashMap_set)
 * [`async HashMap#delete(key)`](#HashMap_delete)
 * [`async HashMap#values()`](#HashMap_values)
 * [`async HashMap#keys()`](#HashMap_keys)
 * [`async * HashMapImpl#entries()`](#HashMapImpl_entries)
 * [`async HashMap#cids()`](#HashMap_cids)
 * [`async HashMapImpl.create(loader, options)`](#HashMapImpl__create)
 * [`async HashMapImpl.load(loader, root, options)`](#HashMapImpl__load)

<a name="HashMap"></a>
### `class HashMap`

An IPLD HashMap object. Create a new HashMap or load an existing one with the asynchronous
[`HashMap.create`](#HashMap__create) factory method.

This class serves mostly as a IPLD usability wrapper for
[IAMap](https://github.com/rvagg/iamap) which implements the majority of the logic behind the
IPLD HashMap specification, without being IPLD-specific. IAMap is immutable, in that each
mutation (delete or set) returns a new IAMap instance. `HashMap`, however, is immutable, and
mutation operations may be performed on the same object but its `cid` property will change
with mutations.

If consumed with TypeScript typings, `HashMap` is generic over value template type `V`, where various
operations will accept or return template type `V`.

Properties:

* `cid` `(CID)`: The _current_ CID of this HashMap. It is important to note that this CID
  will change when successfully performing mutation operations [`HashMap#set`](#HashMap_set) or
  [`HashMap#delete`](#HashMap_delete). Where a [`HashMap#set`](#HashMap_set) does not change an existing value (because
  a key already exists with that value) or [`HashMap#delete`](#HashMap_delete) does not delete an existing
  key/value pair (because it doesn't already exist in this HashMap), the `cid` will not change.

<a name="HashMap_get"></a>
### `async HashMap#get(key)`

* `key` `(string)`: The key of the key/value pair entry to look up in this HashMap.

* Returns:  `Promise<(V|undefined)>`: The value (of template type `V`) stored for the given `key` which may be any type serializable
  by IPLD, or a CID to an existing IPLD object. This should match what was provided by
  [`HashMap#set`](#HashMap_set) as the `value` for this `key`. If the `key` is not stored in this HashMap,
  `undefined` will be returned.

Fetches the value of the provided `key` stored in this HashMap, if it exists.

<a name="HashMap_has"></a>
### `async HashMap#has(key)`

* `key` `(string)`: The key of the key/value pair entry to look up in this HashMap.

* Returns:  `Promise<boolean>`: `true` if the `key` exists in this HashMap, `false` otherwise.

Check whether the provided `key` exists in this HashMap. The equivalent of performing
`map.get(key) !== undefined`.

<a name="HashMap_size"></a>
### `async HashMap#size()`

* Returns:  `Promise<number>`: An integer greater than or equal to zero indicating the number of key/value pairse stored
  in this HashMap.

Count the number of key/value pairs stored in this HashMap.

<a name="HashMap_set"></a>
### `async HashMap#set(key, value)`

* `key` `(string)`: The key of the new key/value pair entry to store in this HashMap.
* `value` `(V)`: The value (of template type `V`) to store, either an object that can be
  serialized inline via IPLD or a CID pointing to another object.

* Returns:  `Promise<void>`

Add a key/value pair to this HashMap. The value may be any object that can be serialized by
IPLD, or a CID to a more complex (or larger) object. [`HashMap#get`](#HashMap_get) operations on the
same `key` will retreve the `value` as it was set as long as serialization and deserialization
results in the same object.

If the `key` already exists in this HashMap, the existing entry will have the `value` replaced
with the new one provided. If the `value` is the same, the HashMap will remain unchanged.

As a mutation operation, performing a successful `set()` where a new key/value pair or new
`value` for a given `key` is set, a new root node will be generated so `map.cid` will be a
different CID. This CID should be used to refer to this collection in the backing store where
persistence is required.

<a name="HashMap_delete"></a>
### `async HashMap#delete(key)`

* `key` `(string)`: The key of the key/value pair entry to remove from this HashMap.

* Returns:  `Promise<void>`

Remove a key/value pair to this HashMap.

If the `key` exists in this HashMap, its entry will be entirely removed. If the `key` does not
exist in this HashMap, no changes will occur.

As a mutation operation, performing a successful `delete()` where an existing key/value pair
is removed from the collection, a new root node will be generated so `map.cid` will be a
different CID. This CID should be used to refer to this collection in the backing store where
persistence is required.

<a name="HashMap_values"></a>
### `async HashMap#values()`

* Returns:  `AsyncIterator<V>`: An async iterator that yields values (of template type `V`) of the type stored in this
  collection, either inlined objects or CIDs.

Asynchronously emit all values that exist within this HashMap collection. This will cause a
full traversal of all nodes that make up this collection so may result in many block loads
from the backing store if the collection is large.

<a name="HashMap_keys"></a>
### `async HashMap#keys()`

* Returns:  `AsyncIterator<string>`: An async iterator that yields string keys stored in this collection.

Asynchronously emit all keys that exist within this HashMap collection. This will cause a
full traversal of all nodes that make up this collection so may result in many block loads
from the backing store if the collection is large.

<a name="HashMapImpl_entries"></a>
### `async * HashMapImpl#entries()`

<a name="HashMap_cids"></a>
### `async HashMap#cids()`

* Returns:  `AsyncIterator<CID>`: An async iterator that yields CIDs for the blocks that comprise this HashMap.

Asynchronously emit all CIDs for blocks that make up this HashMap. This will cause a
full traversal of all nodes that make up this collection so may result in many block loads
from the backing store if the collection is large.

<a name="HashMapImpl__create"></a>
### `async HashMapImpl.create(loader, options)`

* `loader` `(Loader)`: A loader with `get(cid):block` and `put(cid, block)` functions for
  loading an storing block data by CID.
* `options` `(CreateOptions<Codec, V>)`: Options for the HashMap. Defaults are provided but you can tweak
  behavior according to your needs with these options.

* Returns:  `Promise<HashMap<V>>`: - A HashMap instance, either loaded from an existing root block CID, or a new,
  empty HashMap if no CID is provided.

Create a new [`HashMap`](#HashMap) instance, beginning empty, or loading from existing data in a
backing store.

A backing store must be provided to make use of a HashMap, an interface to the store is given
through the mandatory `loader` parameter. The backing store stores IPLD blocks, referenced by
CIDs. `loader` must have two functions: `get(cid)` which should return the raw bytes (`Buffer`
or `Uint8Array`) of a block matching the given CID, and `put(cid, block)` that will store the
provided raw bytes of a block (`block`) and store it with the associated CID.

<a name="HashMapImpl__load"></a>
### `async HashMapImpl.load(loader, root, options)`

* `loader` `(Loader)`
* `root` `(CID)`: A root of an existing HashMap. Provide a CID if you want to load existing
  data.
* `options` `(CreateOptions<Codec, V>)`

* Returns:  `Promise<HashMap<V>>`

## License and Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
