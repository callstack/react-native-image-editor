export interface ImageOffset {
  x: number;
  y: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageCropData {
  offset: ImageOffset;
  size: ImageSize;
  displaySize?: ImageSize;
  resizeMode?: 'contain' | 'cover' | 'stretch';
}
