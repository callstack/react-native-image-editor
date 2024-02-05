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

type ImageCropDataFromSpec = Parameters<Spec['cropImage']>[1];

export interface ImageCropData
  extends Omit<ImageCropDataFromSpec, 'resizeMode'> {
  resizeMode?: 'contain' | 'cover' | 'stretch';
  // ^^^ codegen doesn't support union types yet
  // so to provide more type safety we override the type here
  format?: 'png' | 'jpeg' | 'webp'; // web only
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
  static cropImage(uri: string, cropData: ImageCropData): Promise<string> {
    return RNCImageEditor.cropImage(uri, cropData);
  }
}

export default ImageEditor;
