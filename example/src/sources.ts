export interface ImageSource {
  key: string;
  label: string;
  description: string;
  uri: string;
  headers?: Record<string, string>;
}

export const PRESET_SOURCES: ImageSource[] = [
  {
    key: 'remote',
    label: 'Remote',
    description: 'HTTPS image, downloaded by the native module',
    uri: 'https://picsum.photos/seed/image-editor/1200/900',
  },
  {
    key: 'headers',
    label: 'Headers',
    description: 'Remote image requested with custom HTTP headers',
    uri: 'https://picsum.photos/seed/image-editor-headers/1000/1000',
    headers: {
      'Accept': 'image/*',
      'X-Requested-With': 'image-editor-example',
    },
  },
  {
    key: 'large',
    label: 'Large 4K',
    description: '4000×3000 image to exercise memory-efficient decoding',
    uri: 'https://picsum.photos/seed/image-editor-large/4000/3000',
  },
  {
    key: 'portrait',
    label: 'Portrait',
    description: 'Tall image to check offsets on the vertical axis',
    uri: 'https://picsum.photos/seed/image-editor-portrait/900/1600',
  },
];

export const INVALID_IMAGE_URI =
  'https://picsum.photos/this-image-does-not-exist.jpg';

export function randomImageUri() {
  const seed = Math.random().toString(36).slice(2, 10);
  return `https://picsum.photos/seed/${seed}/1200/800`;
}
