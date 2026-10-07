import type ImageEditor from '@react-native-community/image-editor';

// The library only has a default export, so derive the types from `cropImage`
type CropImage = typeof ImageEditor.cropImage;

export type CropResult = Omit<Awaited<ReturnType<CropImage>>, 'base64'> & {
  base64?: string;
};

export type ImageCropData = Omit<Parameters<CropImage>[1], 'includeBase64'> & {
  includeBase64?: boolean;
};
