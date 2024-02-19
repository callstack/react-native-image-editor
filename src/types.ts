import type { Spec } from './NativeRNCImageEditor.ts';

type ImageCropDataFromSpec = Parameters<Spec['cropImage']>[1];

export interface ImageCropData
  extends Omit<ImageCropDataFromSpec, 'resizeMode' | 'format'> {
  format?: 'png' | 'jpeg' | 'webp';
  resizeMode?: 'contain' | 'cover' | 'stretch';
  // ^^^ codegen doesn't support union types yet
  // so to provide more type safety we override the type here
}

export type CropResult = ReturnType<Spec['cropImage']>;
