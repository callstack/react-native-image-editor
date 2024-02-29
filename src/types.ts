import type { Spec } from './NativeRNCImageEditor.ts';

type ImageCropDataFromSpec = Parameters<Spec['cropImage']>[1];

export interface ImageCropData
  extends Omit<ImageCropDataFromSpec, 'headers' | 'resizeMode' | 'format'> {
  headers?: Record<string, string> | Headers;
  format?: 'png' | 'jpeg' | 'webp';
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  // ^^^ codegen doesn't support union types yet
  // so to provide more type safety we override the type here
}

export interface CropResult
  extends Omit<AsyncReturnType<Spec['cropImage']>, 'type'> {
  type: 'image/jpeg' | 'image/png' | 'image/webp';
  // ^^^ codegen doesn't support union types yet
}

// Utils
type AsyncReturnType<T> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : never;
