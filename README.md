# react-native-image-editor

Image Editor Native module for React Native.

[![Build Status][build-badge]][build]
[![Version][version-badge]][package]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![Lean Core Badge][lean-core-badge]][lean-core-issue]

## Getting started

### Install

```shell
yarn add @react-native-community/image-editor
# or
npm install @react-native-community/image-editor --save
```

### Install Pods

`npx pod-install`

## Usage

Start by importing the library:

```ts
import ImageEditor from "@react-native-community/image-editor";
```

### Crop image

Crop the image specified by the URI param. If URI points to a remote image, it will be downloaded automatically. If the image cannot be loaded/downloaded, the promise will be rejected.

If the cropping process is successful, the resultant cropped image will be stored in the cache path, and the URI returned in the promise will point to the image in the cache path. Remember to delete the cropped image from the cache path when you are done with it.

```ts
ImageEditor.cropImage(uri, cropData).then(url => {
  console.log("Cropped image uri", url);
})
```

### `cropData: ImageCropData`
| Property      | Required | Description                                                                                                                |
|---------------|----------|----------------------------------------------------------------------------------------------------------------------------|
| `offset`      | Yes      | The top-left corner of the cropped image, specified in the original image's coordinate space                               |
| `size`        | Yes      | Size (dimensions) of the cropped image                                                                                     |
| `displaySize` | No       | Size to which you want to scale the cropped image                                                                          |
| `resizeMode`  | No       | Resizing mode to use when scaling the image (iOS only, android resize mode is always 'cover') **Default value**: 'contain' |

```ts
cropData: ImageCropData = {
  offset: {x: number, y: number},
  size: {width: number, height: number},
  displaySize: {width: number, height: number},
  resizeMode: 'contain' | 'cover' | 'stretch',
};
```

For more advanced usage check our [example app](/example/src/App.js).

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
