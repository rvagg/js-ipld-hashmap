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
export declare const HashMapRoot: (obj: any) => boolean;
export declare const HashMapNode: (obj: any) => boolean;
export declare const Element: (obj: any) => boolean;
export declare const Bucket: (obj: any) => boolean;
export declare const BucketEntry: (obj: any) => boolean;
//# sourceMappingURL=schema-validate.d.ts.map