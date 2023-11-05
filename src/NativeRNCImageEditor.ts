import type { TurboModule } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

export interface ImageCropData {
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
}

export interface Spec extends TurboModule {
  cropImage(uri: string, cropData: ImageCropData): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCImageEditor');
