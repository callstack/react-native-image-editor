# @react-native-community/image-editor

[![Build Status][build-badge]][build]
[![Version][version-badge]][package]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![Lean Core Badge][lean-core-badge]][lean-core-issue]

Image Editor Native module for React Native.

Originally extracted from React Native [`issue#23313`](https://github.com/facebook/react-native/issues/23313) and maintained by the community.

## Getting started

### Install

```shell
yarn add @react-native-community/image-editor
# or
npm install @react-native-community/image-editor --save
```

### Install Pods

```shell
npx pod-install
```

## Usage

Start by importing the library:

```ts
import ImageEditor from '@react-native-community/image-editor';
```

### Crop image

Crop the image specified by the URI param. If URI points to a remote image, it will be downloaded automatically. If the image cannot be loaded/downloaded, the promise will be rejected.

If the cropping process is successful, the resultant cropped image will be stored in the cache path, and the [`CropResult`](#result-cropresult) returned in the promise will point to the image in the cache path. ⚠️ Remember to delete the cropped image from the cache path when you are done with it.

```ts
ImageEditor.cropImage(uri, cropData).then((result) => {
  console.log('Cropped image uri:', result.uri);
});
```

### `cropData: ImageCropData`

| Name                            | Type                                            | Description                                                                                                                                                                                                  |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `offset`                        | `{ x: number, y: number }`                      | The top-left corner of the cropped image, specified in the original image's coordinate space                                                                                                                 |
| `size`                          | `{ width: number, height: number }`             | Size (dimensions) of the cropped image                                                                                                                                                                       |
| `displaySize`<br>_(optional)_   | `{ width: number, height: number }`             | Size to which you want to scale the cropped image                                                                                                                                                            |
| `resizeMode`<br>_(optional)_    | `'contain' \| 'cover' \| 'stretch' \| 'center'` | Resizing mode to use when scaling the image (iOS only, Android resize mode is always `'cover'`, Web - no support) <br/>**Default value**: `'cover'`                                                          |
| `quality`<br>_(optional)_       | `number`                                        | A value in range `0.0` - `1.0` specifying compression level of the result image. `1` means no compression (highest quality) and `0` the highest compression (lowest quality) <br/>**Default value**: `0.9`   |
| `format`<br>_(optional)_        | `'jpeg' \| 'png' \| 'webp'`                     | The format of the resulting image.<br/> **Default value**: based on the provided image;<br>if value determination is not possible, `'jpeg'` will be used as a fallback.<br/>`'webp'` isn't supported by iOS. |
| `includeBase64`<br>_(optional)_ | `boolean`                                       | Indicates if Base64 formatted picture data should also be included in the [`CropResult`](#result-cropresult). <br/>**Default value**: `false`                                                                |
| `headers`<br>_(optional)_       | `object \| Headers`                             | An object or [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) interface representing the HTTP headers to send along with the request for a remote image.                                |

### `result: CropResult`

| Name                     | Type     | Description                                                                                                                                                                                    |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uri`                    | `string` | The path to the image file (example: `'file:///data/user/0/.../image.jpg'`)<br> **WEB:** `uri` is the data URI string (example `'data:image/jpeg;base64,/4AAQ...AQABAA'`)                      |
| `path`                   | `string` | The URI of the image (example: `'/data/user/0/.../image.jpg'`)<br> **WEB:** `path` is the blob URL (example `'blob:https://example.com/43ff7a16...e46b1'`)                                     |
| `name`                   | `string` | The name of the image file. (example: `'image.jpg'`)                                                                                                                                           |
| `width`                  | `number` | The width of the image in pixels                                                                                                                                                               |
| `height`                 | `number` | Height of the image in pixels                                                                                                                                                                  |
| `size`                   | `number` | The size of the image in bytes                                                                                                                                                                 |
| `type`                   | `string` | The MIME type of the image (`'image/jpeg'`, `'image/png'`, `'image/webp'`)                                                                                                                     |
| `base64`<br>_(optional)_ | `string` | The base64-encoded image data example: `'/9j/4AAQSkZJRgABAQAAAQABAAD'`<br>if you need data URI as the `source` for an `Image` element for example, you can use `data:${type};base64,${base64}` |

For more advanced usage check our [example app](/example/src/App.tsx).

<!-- badges -->

[build-badge]: https://github.com/callstack/react-native-image-editor/actions/workflows/main.yml/badge.svg
[build]: https://github.com/callstack/react-native-image-editor/actions/workflows/main.yml
[version-badge]: https://img.shields.io/npm/v/@react-native-community/image-editor.svg
[package]: https://www.npmjs.com/package/@react-native-community/image-editor
[license-badge]: https://img.shields.io/npm/l/@react-native-community/image-editor.svg
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
[prs-welcome]: http://makeapullrequest.com
[lean-core-badge]: https://img.shields.io/badge/Lean%20Core-Extracted-brightgreen.svg
[lean-core-issue]: https://github.com/facebook/react-native/issues/23313
