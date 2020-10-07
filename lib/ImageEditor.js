/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {NativeModules, Platform} from 'react-native';

const {RNCImageEditor} = NativeModules;

type ImageCropData = {
  /**
   * The top-left corner of the cropped image, specified in the original
   * image's coordinate space.
   */
  offset: {|
    x: number,
    y: number,
  |},
  /**
   * The size (dimensions) of the cropped image, specified in the original
   * image's coordinate space.
   */
  size: {|
    width: number,
    height: number,
  |},
  /**
   * (Optional) size to scale the cropped image to.
   */
  displaySize?: ?{|
    width: number,
    height: number,
  |},
  /**
   * (Optional) the resizing mode to use when scaling the image. If the
   * `displaySize` param is not specified, this has no effect.
   */
  resizeMode?: ?$Enum<{
    contain: string,
    cover: string,
    stretch: string,
  }>,
};

type Size = {|
  width: number,
  height: number,
|};

type Params = {|
  imageSize: Size,
  rectSize: Size,
|};

export const containImageToRect = ({imageSize, rectSize}: Params): Size => {
  const pageAspectRatio = rectSize.width / rectSize.height;
  const imageAspectRatio = imageSize.width / imageSize.height;

  if (imageAspectRatio >= pageAspectRatio) {
    return {
      width: rectSize.width,
      height: rectSize.width / imageAspectRatio,
    };
  }

  return {
    width: rectSize.height * imageAspectRatio,
    height: rectSize.height,
  };
};

const processCropData = (cropData: ImageCropData): ImageCropData => {
  if (
    Platform.OS === 'android' &&
    cropData.displaySize &&
    (cropData.resizeMode === 'contain' || cropData.resizeMode === undefined)
  ) {
    return {
      ...cropData,
      displaySize: containImageToRect({
        imageSize: cropData.size,
        rectSize: cropData.displaySize,
      }),
    };
  }

  return cropData;
};

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
    return RNCImageEditor.cropImage(uri, processCropData(cropData));
  }
}

export default ImageEditor;
