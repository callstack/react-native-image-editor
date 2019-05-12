# react-native-image-editor

Image Editor Native module for React Native. This module was extracted from React-Native core in the ["Lean Core"](https://github.com/facebook/react-native/issues/23313) process.

[![Build Status][build-badge]][build]
[![Version][version-badge]][package]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-welcome-badge]][prs-welcome]

## Getting started

### Install

`yarn add @react-native-community/image-editor`

or

`npm install @react-native-community/image-editor --save`

### Link

`react-native link @react-native-community/image-editor`

## Api reference

```javascript
  static cropImage(uri, cropData, success, failure)
```

Crop the image specified by the URI param. If URI points to a remote image, it will be downloaded automatically. If the image cannot be loaded/downloaded, the failure callback will be called.

If the cropping process is successful, the resultant cropped image will be stored in the ImageStore, and the URI returned in the success callback will point to the image in the store. Remember to delete the cropped image from the ImageStore when you are done with it.

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
