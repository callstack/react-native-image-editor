import type { TurboModule } from 'react-native';
import type { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';
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
    }
  ): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCImageEditor');
