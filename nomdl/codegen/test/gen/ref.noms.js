// This file was generated by nomdl/codegen.
// @flow
/* eslint-disable */

import {
  Field as _Field,
  Kind as _Kind,
  Package as _Package,
  createStructClass as _createStructClass,
  float32Type as _float32Type,
  makeCompoundType as _makeCompoundType,
  makeStructType as _makeStructType,
  makeType as _makeType,
  registerPackage as _registerPackage,
} from '@attic/noms';
import type {
  NomsSet as _NomsSet,
  RefValue as _RefValue,
  Struct as _Struct,
  float32 as _float32,
} from '@attic/noms';

const _pkg = new _Package([
  _makeStructType('StructWithRef',
      [
        new _Field('r', _makeCompoundType(_Kind.Ref, _makeCompoundType(_Kind.Set, _float32Type)), false),
      ],
      [

      ]
    ),
], [
]);
_registerPackage(_pkg);
const StructWithRef$type = _makeType(_pkg.ref, 0);
const StructWithRef$typeDef = _pkg.types[0];


type StructWithRef$Data = {
  r: _RefValue<_NomsSet<_float32>>;
};

interface StructWithRef$Interface extends _Struct {
  constructor(data: StructWithRef$Data): void;
  r: _RefValue<_NomsSet<_float32>>;  // readonly
  setR(value: _RefValue<_NomsSet<_float32>>): StructWithRef$Interface;
}

export const StructWithRef: Class<StructWithRef$Interface> = _createStructClass(StructWithRef$type, StructWithRef$typeDef);