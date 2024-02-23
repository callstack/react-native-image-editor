/* eslint-disable */
import ImageEditorNative from '../index.ts';

const requiredParams = {
  size: { width: 100, height: 100 },
  offset: { x: 0, y: 0 },
};

ImageEditorNative.cropImage('<test>', {
  ...requiredParams,
  includeBase64: true,
  // ^^^: if `true` then result has `base64` property as string
}).then((e) => {
  const a: string = e.base64;
  // @ts-expect-error - base64 is a string
  const b: number = e.base64;
});

ImageEditorNative.cropImage('<test>', {
  ...requiredParams,
  includeBase64: false,
  // ^^^: if `false` then result doesn't have `base64` property
}).then((e) => {
  // @ts-expect-error - base64 doesn't exist
  const a: string = e.base64;
});

ImageEditorNative.cropImage('<test>', {
  ...requiredParams,
  // includeBase64: false,
  // ^^^: if `undefined` then result doesn't have `base64` property
}).then((e) => {
  // @ts-expect-error - base64 doesn't exist
  const a: string = e.base64;
});
