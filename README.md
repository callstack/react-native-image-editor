# react-native-image-editor

Image Editor Native module for React Native.

[![Build Status][build-badge]][build]
[![Version][version-badge]][package]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![Lean Core Badge][lean-core-badge]][lean-core-issue]

## Getting started

### Install

`yarn add @react-native-community/image-editor`

or

`npm install @react-native-community/image-editor --save`

### Link

`react-native link @react-native-community/image-editor`

## Usage

Start by importing the library:

```javascript
import ImageEditor from "@react-native-community/image-editor";
```

### Crop image

Crop the image specified by the URI param. If URI points to a remote image, it will be downloaded automatically. If the image cannot be loaded/downloaded, the promise will be rejected.

If the cropping process is successful, the resultant cropped image will be stored in the cache path, and the URI returned in the promise will point to the image in the cache path. Remember to delete the cropped image from the cache path when you are done with it.

```javascript
  ImageEditor.cropImage(uri, cropData).then(url => {
    console.log("Cropped image uri", url);
  })
```

### cropData
| Property      | Required | Description                                                                                                                |
|---------------|----------|----------------------------------------------------------------------------------------------------------------------------|
| `offset`      | Yes      | The top-left corner of the cropped image, specified in the original image's coordinate space                               |
| `size`        | Yes      | Size (dimensions) of the cropped image                                                                                     |
| `displaySize` | No       | Size to which you want to scale the cropped image                                                                          |
| `resizeMode`  | No       | Resizing mode to use when scaling the image (iOS only, android resize mode is always 'cover') **Default value**: 'contain' |

```javascript
  cropData = {
    offset: {x: number, y: number},
    size: {width: number, height: number},
    displaySize: {width: number, height: number},
    resizeMode: 'contain' | 'cover' | 'stretch',
  };
```

For more advanced usage check our [example app](/example/src/App.js).

<!-- badges -->
[build-badge]: https://img.shields.io/circleci/project/github/react-native-community/react-native-image-editor/master.svg?style=flat-square
[build]: https://circleci.com/gh/react-native-community/react-native-image-editor
[version-badge]: https://img.shields.io/npm/v/@react-native-community/image-editor.svg?style=flat-square
[package]: https://www.npmjs.com/package/@react-native-community/image-editor
[license-badge]: https://img.shields.io/npm/l/@react-native-community/image-editor.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[lean-core-badge]: https://img.shields.io/badge/Lean%20Core-Extracted-brightgreen.svg?style=flat-square
[lean-core-issue]: https://github.com/facebook/react-native/issues/23313
