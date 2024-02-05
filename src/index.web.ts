import type { Spec } from './NativeRNCImageEditor';

type ImageCropDataFromSpec = Parameters<Spec['cropImage']>[1];

export interface ImageCropData
  extends Omit<ImageCropDataFromSpec, 'resizeMode'> {
  resizeMode?: 'contain' | 'cover' | 'stretch';
  // ^^^ codegen doesn't support union types yet
  // so to provide more type safety we override the type here
  format?: 'png' | 'jpeg' | 'webp'; // web only
}

function drawImage(
  img: HTMLImageElement,
  { offset, size, displaySize }: ImageCropData
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  const sx = offset.x,
    sy = offset.y,
    sWidth = size.width,
    sHeight = size.height,
    dx = 0,
    dy = 0,
    dWidth = displaySize?.width ?? sWidth,
    dHeight = displaySize?.height ?? sHeight;

  canvas.width = dWidth;
  canvas.height = dHeight;

  context.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

  return canvas;
}

function fetchImage(imgSrc: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const onceOptions = { once: true };
    const img = new Image();

    function onImageError(event: ErrorEvent) {
      reject(event);
    }

    function onLoad() {
      resolve(img);
    }

    img.addEventListener('error', onImageError, onceOptions);
    img.addEventListener('load', onLoad, onceOptions);
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
  });
}

class ImageEditor {
  static cropImage(imgSrc: string, cropData: ImageCropData): Promise<string> {
    /**
     * Returns a promise that resolves with the base64 encoded string of the cropped image
     */
    return fetchImage(imgSrc).then(function onfulfilledImgToCanvas(image) {
      const canvas = drawImage(image, cropData);
      return canvas.toDataURL(
        `image/${cropData.format ?? 'jpeg'}`,
        cropData.quality ?? 1
      );
    });
  }
}

export default ImageEditor;
