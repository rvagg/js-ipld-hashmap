/** Auto-generated with ipld-schema-validator@1.0.1 at Tue Aug 16 2022 from IPLD Schema:
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
  Null: /** @returns {boolean} */ (/** @type {any} */ obj) => obj === null,
  Int: /** @returns {boolean} */ (/** @type {any} */ obj) => Number.isInteger(obj),
  Float: /** @returns {boolean} */ (/** @type {any} */ obj) => typeof obj === 'number' && Number.isFinite(obj),
  String: /** @returns {boolean} */ (/** @type {any} */ obj) => typeof obj === 'string',
  Bool: /** @returns {boolean} */ (/** @type {any} */ obj) => typeof obj === 'boolean',
  Bytes: /** @returns {boolean} */ (/** @type {any} */ obj) => obj instanceof Uint8Array,
  Link: /** @returns {boolean} */ (/** @type {any} */ obj) => !Kinds.Null(obj) && typeof obj === 'object' && obj.asCID === obj,
  List: /** @returns {boolean} */ (/** @type {any} */ obj) => Array.isArray(obj),
  Map: /** @returns {boolean} */ (/** @type {any} */ obj) => !Kinds.Null(obj) && typeof obj === 'object' && obj.asCID !== obj && !Kinds.List(obj) && !Kinds.Bytes(obj)
}
/** @type {{ [k in string]: (obj:any)=>boolean}} */
const Types = {
  Int: Kinds.Int,
  'HashMapRoot > hashAlg': /** @returns {boolean} */ (/** @type {any} */ obj) => Types.Int(obj),
  'HashMapRoot > bucketSize': /** @returns {boolean} */ (/** @type {any} */ obj) => Types.Int(obj),
  Bytes: Kinds.Bytes,
  'HashMapNode > map': /** @returns {boolean} */ (/** @type {any} */ obj) => Types.Bytes(obj),
  'Element > HashMapNode (anon)': Kinds.Link,
  'BucketEntry > key': /** @returns {boolean} */ (/** @type {any} */ obj) => Types.Bytes(obj),
  Any: /** @returns {boolean} */ (/** @type {any} */ obj) => (Kinds.Bool(obj) && Types.Bool(obj)) || (Kinds.String(obj) && Types.String(obj)) || (Kinds.Bytes(obj) && Types.Bytes(obj)) || (Kinds.Int(obj) && Types.Int(obj)) || (Kinds.Float(obj) && Types.Float(obj)) || (Kinds.Null(obj) && Types.Null(obj)) || (Kinds.Link(obj) && Types.Link(obj)) || (Kinds.Map(obj) && Types.AnyMap(obj)) || (Kinds.List(obj) && Types.AnyList(obj)),
  Bool: Kinds.Bool,
  String: Kinds.String,
  Float: Kinds.Float,
  Null: Kinds.Null,
  Link: Kinds.Link,
  AnyMap: /** @returns {boolean} */ (/** @type {any} */ obj) => Kinds.Map(obj) && Array.prototype.every.call(Object.values(obj), Types.Any),
  AnyList: /** @returns {boolean} */ (/** @type {any} */ obj) => Kinds.List(obj) && Array.prototype.every.call(obj, Types.Any),
  'BucketEntry > value': /** @returns {boolean} */ (/** @type {any} */ obj) => Types.Any(obj),
  BucketEntry: /** @returns {boolean} */ (/** @type {any} */ obj) => Kinds.List(obj) && obj.length === 2 && Types['BucketEntry > key'](obj[0]) && Types['BucketEntry > value'](obj[1]),
  Bucket: /** @returns {boolean} */ (/** @type {any} */ obj) => Kinds.List(obj) && Array.prototype.every.call(obj, Types.BucketEntry),
  Element: /** @returns {boolean} */ (/** @type {any} */ obj) => (Kinds.Link(obj) && Types['Element > HashMapNode (anon)'](obj)) || (Kinds.List(obj) && Types.Bucket(obj)),
  'HashMapNode > data (anon)': /** @returns {boolean} */ (/** @type {any} */ obj) => Kinds.List(obj) && Array.prototype.every.call(obj, Types.Element),
  'HashMapNode > data': /** @returns {boolean} */ (/** @type {any} */ obj) => Types['HashMapNode > data (anon)'](obj),
  HashMapNode: /** @returns {boolean} */ (/** @type {any} */ obj) => Kinds.List(obj) && obj.length === 2 && Types['HashMapNode > map'](obj[0]) && Types['HashMapNode > data'](obj[1]),
  'HashMapRoot > hamt': /** @returns {boolean} */ (/** @type {any} */ obj) => Types.HashMapNode(obj),
  HashMapRoot: /** @returns {boolean} */ (/** @type {any} */ obj) => { const keys = obj && Object.keys(obj); return Kinds.Map(obj) && ['hashAlg', 'bucketSize', 'hamt'].every((k) => keys.includes(k)) && Object.entries(obj).every(([name, value]) => Types['HashMapRoot > ' + name] && Types['HashMapRoot > ' + name](value)) }
}

export const HashMapRoot = Types.HashMapRoot
export const HashMapNode = Types.HashMapNode
export const Element = Types.Element
export const Bucket = Types.Bucket
export const BucketEntry = Types.BucketEntry
