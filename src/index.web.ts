import type { ImageCropData, CropResult } from './types.ts';

const ERROR_PREFIX = 'ImageEditor: ';

function drawImage(
  img: HTMLImageElement | ImageBitmap,
  { offset, size, displaySize }: ImageCropData
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error(ERROR_PREFIX + 'Failed to get canvas context');
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

function fetchImage(
  imgSrc: string,
  headers: ImageCropData['headers']
): Promise<HTMLImageElement | ImageBitmap> {
  if (headers) {
    return fetch(imgSrc, {
      method: 'GET',
      headers: new Headers(headers),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            ERROR_PREFIX +
              'Failed to fetch the image: ' +
              imgSrc +
              '. Request failed with status: ' +
              response.status
          );
        }
        return response.blob();
      })
      .then((blob) => createImageBitmap(blob));
  }

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

const DEFAULT_COMPRESSION_QUALITY = 0.9;

class ImageEditor {
  static cropImage(
    imgSrc: string,
    cropData: ImageCropData
  ): Promise<CropResult> {
    /**
     * Returns a promise that resolves with the base64 encoded string of the cropped image
     */
    return fetchImage(imgSrc, cropData.headers).then(
      function onfulfilledImgToCanvas(image) {
        const ext = cropData.format ?? 'jpeg';
        const type = `image/${ext}`;
        const quality = cropData.quality ?? DEFAULT_COMPRESSION_QUALITY;
        const canvas = drawImage(image, cropData);

        return new Promise<Blob | null>(function onfulfilledCanvasToBlob(
          resolve
        ) {
          canvas.toBlob(resolve, type, quality);
        }).then((blob) => {
          if (!blob) {
            throw new Error('Image cannot be created from canvas');
          }

          let _path: string, _uri: string;

          const result: CropResult = {
            width: canvas.width,
            height: canvas.height,
            name: 'ReactNative_cropped_image.' + ext,
            type: ('image/' + ext) as CropResult['type'],
            size: blob.size,
            // Lazy getters to avoid unnecessary memory usage
            get path() {
              if (!_path) {
                _path = URL.createObjectURL(blob);
              }
              return _path;
            },
            get uri() {
              return result.base64 as string;
            },
            get base64() {
              if (!_uri) {
                _uri = canvas.toDataURL(type, quality);
              }
              return _uri.split(',')[1];
              // ^^^ remove `data:image/xxx;base64,` prefix (to align with iOS/Android platform behavior)
            },
          };

          return result;
        });
      }
    );
  }
}

export default ImageEditor;
