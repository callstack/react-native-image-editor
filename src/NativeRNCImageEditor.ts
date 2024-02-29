import type { TurboModule } from 'react-native';
import type {
  Double,
  Float,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  cropImage(
    uri: string,
    cropData: {
      // inlined `ImageCropData` type (for older RN versions 71 and below)
      /**
       * The top-left corner of the cropped image, specified in the original
       * image's coordinate space.
       */
      offset: {
        x: Double;
        y: Double;
      };
      /**
       * The size (dimensions) of the cropped image, specified in the original
       * image's coordinate space.
       */
      size: {
        width: Double;
        height: Double;
      };
      /**
       * (Optional) size to scale the cropped image to.
       */
      displaySize?: {
        width: Double;
        height: Double;
      };
      /**
       * (Optional) the resizing mode to use when scaling the image. If the
       * `displaySize` param is not specified, this has no effect.
       */
      resizeMode?: string;

      /**
       * (Optional) Compression quality jpg images (number from 0 to 1).
       */
      quality?: Float;

      /**
       * (Optional) The format of the resulting image. Default auto-detection based on given image
       */
      format?: string;

      /**
       * (Optional) Indicates if Base64 formatted picture data should also be included in the result.
       */
      includeBase64?: boolean;

      /**
       * (Optional) An object representing the HTTP headers to send along with the request for a remote image.
       */
      headers?: {
        [key: string]: string;
      };
    }
  ): Promise<{
    /**
     *  The path to the image file (example: '/data/user/0/.../image.jpg')
     */
    path: string;
    /**
     * The URI of the image (example: 'file:///data/user/0/.../image.jpg')
     */
    uri: string;
    /**
     * The name of the image file. (example: 'image.jpg')
     */
    name: string;
    /**
     * The width of the image in pixels
     */
    width: Int32;
    /**
     * The height of the image in pixels
     */
    height: Int32;
    /**
     * The size of the image in bytes
     */
    size: Int32;

    /**
     * MIME type of the image (example: 'image/jpeg')
     */
    type: string;

    /**
     * The base64 string of the image if the `base64` param is true
     */
    base64?: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCImageEditor');
