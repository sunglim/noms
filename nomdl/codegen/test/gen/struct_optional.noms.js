// This file was generated by nomdl/codegen.
// @flow
/* eslint-disable */

import {
  Field as _Field,
  Package as _Package,
  boolType as _boolType,
  createStructClass as _createStructClass,
  makeStructType as _makeStructType,
  makeType as _makeType,
  registerPackage as _registerPackage,
  stringType as _stringType,
} from '@attic/noms';
import type {
  Struct as _Struct,
} from '@attic/noms';

const _pkg = new _Package([
  _makeStructType('OptionalStruct',
      [
        new _Field('s', _stringType, true),
        new _Field('b', _boolType, true),
      ],
      [

      ]
    ),
], [
]);
_registerPackage(_pkg);
const OptionalStruct$type = _makeType(_pkg.ref, 0);
const OptionalStruct$typeDef = _pkg.types[0];


type OptionalStruct$Data = {
  s?: string;
  b?: boolean;
};

interface OptionalStruct$Interface extends _Struct {
  constructor(data: OptionalStruct$Data): void;
  s: ?string;  // readonly
  setS(value: ?string): OptionalStruct$Interface;
  b: ?boolean;  // readonly
  setB(value: ?boolean): OptionalStruct$Interface;
}

export const OptionalStruct: Class<OptionalStruct$Interface> = _createStructClass(OptionalStruct$type, OptionalStruct$typeDef);