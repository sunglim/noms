// Copyright 2016 Attic Labs, Inc. All rights reserved.
// Licensed under the Apache License, version 2.0:
// http://www.apache.org/licenses/LICENSE-2.0

// @flow

import type {BlobLeafSequence} from './blob.js';
import type {ListLeafSequence} from './list.js';
import type {MapLeafSequence} from './map.js';
import type Ref from './ref.js';
import {constructRef} from './ref.js';
import Sequence from './sequence.js';
import type {SetLeafSequence} from './set.js';
import type Struct from './struct.js';
import type Value from './value.js';
import type {NomsKind} from './noms-kind.js';
import type {NomsWriter} from './noms-writer.js';
import type {ValueWriter} from './value-store.js';
import type {primitive} from './primitives.js';
import type {MetaTuple} from './meta-sequence.js';
import {boolType, CycleDesc, getTypeOfValue, makeRefType, StructDesc} from './type.js';
import type {Type} from './type.js';
import {invariant, notNull} from './assert.js';
import {isPrimitiveKind, kindToString, Kind} from './noms-kind.js';

type primitiveOrArray = primitive | Array<primitiveOrArray>;

export default class ValueEncoder {
  _w: NomsWriter;
  _vw: ?ValueWriter;

  constructor(w: NomsWriter, ds: ?ValueWriter) {
    this._w = w;
    this._vw = ds;
  }

  writeKind(k: NomsKind) {
    this._w.writeUint8(k);
  }

  writeRef(r: Ref<any>) {
    this._w.writeHash(r.targetHash);
    this._w.writeUint64(r.height);
  }

  writeType(t: Type<any>, parentStructTypes: Type<StructDesc>[]) {
    const k = t.kind;
    switch (k) {
      case Kind.List:
      case Kind.Map:
      case Kind.Ref:
      case Kind.Set:
        this.writeKind(k);
        t.elemTypes.forEach(elemType => this.writeType(elemType, parentStructTypes));
        break;
      case Kind.Union:
        this.writeKind(k);
        this._w.writeUint32(t.elemTypes.length);
        t.elemTypes.forEach(elemType => this.writeType(elemType, parentStructTypes));
        break;
      case Kind.Struct:
        this.writeStructType(t, parentStructTypes);
        break;
      case Kind.Cycle:
        invariant(t.desc instanceof CycleDesc);
        this.writeCycle(t.desc.level);
        break;
      default:
        invariant(isPrimitiveKind(k));
        this.writeKind(k);
    }
  }

  writeBlobLeafSequence(seq: BlobLeafSequence) {
    invariant(seq.items instanceof Uint8Array);
    this._w.writeBytes(seq.items);
  }

  writeValueList(values: Value[]) {
    const count = values.length;
    this._w.writeUint32(count);
    values.forEach(sv => this.writeValue(sv));
  }

  writeListLeafSequence(seq: ListLeafSequence<any>) {
    this.writeValueList(seq.items);
  }

  writeSetLeafSequence(seq: SetLeafSequence<any>) {
    this.writeValueList(seq.items);
  }

  writeMapLeafSequence(seq: MapLeafSequence<any, any>) {
    const count = seq.items.length;
    this._w.writeUint32(count);

    seq.items.forEach(entry => {
      this.writeValue(entry[0]);
      this.writeValue(entry[1]);
    });
  }

  maybeWriteMetaSequence(v: Sequence<any>): boolean {
    if (!v.isMeta) {
      this._w.writeBool(false); // not a meta sequence
      return false;
    }

    this._w.writeBool(true); // a meta sequence

    const count = v.items.length;
    this._w.writeUint32(count);
    for (let i = 0; i < count; i++) {
      const tuple: MetaTuple<any> = v.items[i];
      // invariant(tuple instanceof MetaTuple);
      const child = tuple.child;
      if (child && this._vw) {
        this._vw.writeValue(child);
      }
      this.writeValue(tuple.ref);
      let val = tuple.key.v;
      if (!tuple.key.isOrderedByValue) {
        // See https://github.com/attic-labs/noms/issues/1688#issuecomment-227528987
        val = constructRef(makeRefType(boolType), notNull(tuple.key.h), 0);
      } else {
        val = notNull(val);
      }
      this.writeValue(val);
      this._w.writeUint64(tuple.numLeaves);
    }
    return true;
  }

  writeValue(v: Value) {
    const t = getTypeOfValue(v);
    this._w.appendType(t);
    switch (t.kind) {
      case Kind.Blob: {
        // $FlowIssue: We know v is a Blob here.
        const sequence = v.sequence;
        if (this.maybeWriteMetaSequence(sequence)) {
          break;
        }

        this.writeBlobLeafSequence(sequence);
        break;
      }
      case Kind.Bool: {
        // $FlowIssue: We know b is a boolean here.
        const b: boolean = v;
        this._w.writeBool(b);
        break;
      }
      case Kind.Number: {
        // $FlowIssue: We know n is a number here.
        const n: number = v;
        if (!Number.isFinite(n)) {
          throw new Error(`${n} is not a supported number`);
        }
        this._w.writeNumber(n);
        break;
      }
      case Kind.List: {
        // $FlowIssue: We know v is a List here.
        const sequence = v.sequence;
        if (this.maybeWriteMetaSequence(sequence)) {
          break;
        }

        this.writeListLeafSequence(sequence);
        break;
      }
      case Kind.Map: {
        // $FlowIssue: We know v is a Map here.
        const sequence = v.sequence;
        if (this.maybeWriteMetaSequence(sequence)) {
          break;
        }

        this.writeMapLeafSequence(sequence);
        break;
      }
      case Kind.Ref:
        // $FlowIssue: We know v is a Ref here.
        this.writeRef(v);
        break;
      case Kind.Set: {
        // $FlowIssue: We know v is a Set here.
        const sequence = v.sequence;
        if (this.maybeWriteMetaSequence(sequence)) {
          break;
        }

        this.writeSetLeafSequence(sequence);
        break;
      }
      case Kind.String:
        // $FlowIssue: We know v is a string here.
        this._w.writeString(v);
        break;

      case Kind.Type:
        // $FlowIssue: We know v is a Type here.
        this.writeType(v, []);
        break;
      case Kind.Struct:
        // $FlowIssue: We know v is a Struct here.
        this.writeStruct(v);
        break;
      case Kind.Cycle:
      case Kind.Union:
      case Kind.Value:
        throw new Error('A value instance can never have type ' + kindToString[t.kind]);
      default:
        throw new Error(`Not implemented: ${t.kind} ${String(v)}`);
    }
  }

  writeStruct(s: Struct) {
    const {values} = s;
    for (let i = 0; i < values.length; i++) {
      this.writeValue(values[i]);
    }
  }

  writeCycle(i: number) {
    this.writeKind(Kind.Cycle);
    this._w.writeUint32(i);
  }

  writeStructType(t: Type<StructDesc>, parentStructTypes: Type<StructDesc>[]) {
    const i = parentStructTypes.indexOf(t);
    if (i !== -1) {
      this.writeCycle(parentStructTypes.length - i - 1);
      return;
    }

    parentStructTypes.push(t);
    const {desc} = t;
    this.writeKind(t.kind);
    this._w.writeString(desc.name);

    this._w.writeUint32(desc.fieldCount);

    desc.forEachField((name: string, type: Type<any>) => {
      this._w.writeString(name);
      this.writeType(type, parentStructTypes);
    });
    parentStructTypes.pop();
  }
}
