/** Auto-generated with ipld-schema-validator@1.0.0 at Mon Jun 14 2021 from IPLD Schema:
 *
 * # Root node layout
 * type HashMapRoot struct {
 *   hashAlg Int
 *   bucketSize Int
 *   hamt HashMapNode
 * }
 *
 * # Non-root node layout
 * type HashMapNode struct {
 *   map Bytes
 *   data [ Element ]
 * } representation tuple
 *
 * type Element union {
 *   | &HashMapNode link
 *   | Bucket list
 * } representation kinded
 *
 * type Bucket [ BucketEntry ]
 *
 * type BucketEntry struct {
 *   key Bytes
 *   value Any
 * } representation tuple
 *
 */

const Kinds = {
  Null: (obj) => obj === null,
  Int: (obj) => Number.isInteger(obj),
  Float: (obj) => typeof obj === 'number' && Number.isFinite(obj),
  String: (obj) => typeof obj === 'string',
  Bool: (obj) => typeof obj === 'boolean',
  Bytes: (obj) => obj instanceof Uint8Array,
  Link: (obj) => !Kinds.Null(obj) && typeof obj === 'object' && obj.asCID === obj,
  List: (obj) => Array.isArray(obj),
  Map: (obj) => !Kinds.Null(obj) && typeof obj === 'object' && obj.asCID !== obj && !Kinds.List(obj) && !Kinds.Bytes(obj)
}
const Types = {
  Int: Kinds.Int,
  'HashMapRoot > hashAlg': (obj) => Types.Int(obj),
  'HashMapRoot > bucketSize': (obj) => Types.Int(obj),
  Bytes: Kinds.Bytes,
  'HashMapNode > map': (obj) => Types.Bytes(obj),
  'Element > HashMapNode (anon)': Kinds.Link,
  'BucketEntry > key': (obj) => Types.Bytes(obj),
  Any: (obj) => (Kinds.Bool(obj) && Types.Bool(obj)) || (Kinds.String(obj) && Types.String(obj)) || (Kinds.Bytes(obj) && Types.Bytes(obj)) || (Kinds.Int(obj) && Types.Int(obj)) || (Kinds.Float(obj) && Types.Float(obj)) || (Kinds.Null(obj) && Types.Null(obj)) || (Kinds.Link(obj) && Types.Link(obj)) || (Kinds.Map(obj) && Types.AnyMap(obj)) || (Kinds.List(obj) && Types.AnyList(obj)),
  Bool: Kinds.Bool,
  String: Kinds.String,
  Float: Kinds.Float,
  Null: Kinds.Null,
  Link: Kinds.Link,
  AnyMap: (obj) => Kinds.Map(obj) && Array.prototype.every.call(Object.values(obj), Types.Any),
  AnyList: (obj) => Kinds.List(obj) && Array.prototype.every.call(obj, Types.Any),
  'BucketEntry > value': (obj) => Types.Any(obj),
  BucketEntry: (obj) => Kinds.List(obj) && obj.length === 2 && Types['BucketEntry > key'](obj[0]) && Types['BucketEntry > value'](obj[1]),
  Bucket: (obj) => Kinds.List(obj) && Array.prototype.every.call(obj, Types.BucketEntry),
  Element: (obj) => (Kinds.Link(obj) && Types['Element > HashMapNode (anon)'](obj)) || (Kinds.List(obj) && Types.Bucket(obj)),
  'HashMapNode > data (anon)': (obj) => Kinds.List(obj) && Array.prototype.every.call(obj, Types.Element),
  'HashMapNode > data': (obj) => Types['HashMapNode > data (anon)'](obj),
  HashMapNode: (obj) => Kinds.List(obj) && obj.length === 2 && Types['HashMapNode > map'](obj[0]) && Types['HashMapNode > data'](obj[1]),
  'HashMapRoot > hamt': (obj) => Types.HashMapNode(obj),
  HashMapRoot: (obj) => { const keys = obj && Object.keys(obj); return Kinds.Map(obj) && ['hashAlg', 'bucketSize', 'hamt'].every((k) => keys.includes(k)) && Object.entries(obj).every(([name, value]) => Types['HashMapRoot > ' + name] && Types['HashMapRoot > ' + name](value)) }
}

module.exports.HashMapRoot = Types.HashMapRoot
module.exports.HashMapNode = Types.HashMapNode
module.exports.Element = Types.Element
module.exports.Bucket = Types.Bucket
module.exports.BucketEntry = Types.BucketEntry
