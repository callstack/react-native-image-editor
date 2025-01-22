/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Platform } from 'react-native';
import NativeRNCImageEditor from './NativeRNCImageEditor';
import type { Spec } from './NativeRNCImageEditor';
import type { ImageCropData, CropResult } from './types.ts';

const LINKING_ERROR =
  `The package '@react-native-community/image-editor' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const RNCImageEditor: Spec = NativeRNCImageEditor
  ? NativeRNCImageEditor
  : new Proxy({} as Spec, {
      get() {
        throw new Error(LINKING_ERROR);
      },
    });

type CropResultWithoutBase64 = Omit<CropResult, 'base64'>;
type ImageCropDataWithoutBase64 = Omit<ImageCropData, 'includeBase64'>;

function toHeadersObject(
  headers: ImageCropData['headers']
): Record<string, string> | undefined {
  return headers instanceof Headers
    ? Object.fromEntries(headers.entries())
    : headers;
}

class ImageEditor {
  /**
   * Crop the image specified by the URI param. If URI points to a remote
   * image, it will be downloaded automatically. If the image cannot be
   * loaded/downloaded, the promise will be rejected. On Android, a
   * downloaded image may be cached in external storage, a publicly accessible
   * location, if it has more available space than internal storage.
   *
   * If the cropping process is successful, the resultant cropped image
   * will be stored in the Cache Path, and the URI returned in the promise
   * will point to the image in the cache path. Remember to delete the
   * cropped image from the cache path when you are done with it.
   */

  // TS overload for better `base64` type inference (see: `src/__typetests__/index.ts`)
  static cropImage(
    uri: string,
    cropData: ImageCropDataWithoutBase64
  ): Promise<CropResultWithoutBase64>;
  static cropImage(
    uri: string,
    cropData: ImageCropDataWithoutBase64 & { includeBase64: false }
  ): Promise<CropResultWithoutBase64>;
  static cropImage(
    uri: string,
    cropData: ImageCropDataWithoutBase64 & { includeBase64: true }
  ): Promise<CropResultWithoutBase64 & { base64: string }>;

  static cropImage(uri: string, cropData: ImageCropData): Promise<CropResult> {
    return RNCImageEditor.cropImage(uri, {
      ...cropData,
      headers: toHeadersObject(cropData.headers),
    }) as Promise<CropResult>;
  }
}

export default ImageEditor;
