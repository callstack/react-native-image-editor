type $Maybe<T> = T | null | undefined;

export type ImageCropData = {
  /**
   * The top-left corner of the cropped image, specified in the original
   * image's coordinate space.
   */
  offset: {
    x: number,
    y: number,
  },
  /**
   * The size (dimensions) of the cropped image, specified in the original
   * image's coordinate space.
   */
  size: {
    width: number,
    height: number,
  },
  /**
   * (Optional) size to scale the cropped image to.
   */
  displaySize?: $Maybe<{
    width: number,
    height: number,
  }>,
  /**
   * (Optional) the resizing mode to use when scaling the image. If the
   * `displaySize` param is not specified, this has no effect.
   */
  resizeMode?: $Maybe<"contain" | "cover" | "stretch">,
};

declare class ImageEditor {
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
  static cropImage: (
    uri: string,
    cropData: ImageCropData,
  ) => Promise<string>
}

export default ImageEditor