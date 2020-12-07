/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Platform,
} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';

const DEFAULT_IMAGE_HEIGHT = 720;
const DEFAULT_IMAGE_WIDTH = 1080;

type ImageOffset = {|
  x: number,
  y: number,
|};

type ImageSize = {|
  width: number,
  height: number,
|};

type ImageCropData = {|
  offset: ImageOffset,
  size: ImageSize,
  displaySize?: ?ImageSize,
  resizeMode?: ?any,
|};

export default class SquareImageCropper extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  state: any;
  _isMounted: boolean;
  _transformData: ImageCropData;

  /* $FlowFixMe(>=0.85.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.85 was deployed. To see the error, delete this comment
   * and run Flow. */
  constructor(props) {
    super(props);
    this._isMounted = true;
    this.state = {
      photo: {
        uri: `https://source.unsplash.com/2Ts5HnA67k8/${DEFAULT_IMAGE_WIDTH}x${DEFAULT_IMAGE_HEIGHT}`,
        height: DEFAULT_IMAGE_HEIGHT,
        width: DEFAULT_IMAGE_WIDTH,
      },
      measuredSize: null,
      croppedImageURI: null,
      cropError: null,
    };
  }

  render() {
    if (!this.state.measuredSize) {
      return (
        <View
          style={styles.container}
          onLayout={(event) => {
            const measuredWidth = event.nativeEvent.layout.width;
            if (!measuredWidth) {
              return;
            }
            this.setState({
              measuredSize: {width: measuredWidth, height: measuredWidth},
            });
          }}
        />
      );
    }

    if (!this.state.croppedImageURI) {
      return this._renderImageCropper();
    }
    return this._renderCroppedImage();
  }

  _renderImageCropper() {
    if (!this.state.photo) {
      return <View style={styles.container} />;
    }
    let error = null;
    if (this.state.cropError) {
      error = <Text>{this.state.cropError.message}</Text>;
    }
    return (
      <View style={styles.container}>
        <Text style={styles.text} testID={'headerText'}>
          Drag the image within the square to crop:
        </Text>
        <ImageCropper
          image={this.state.photo}
          size={this.state.measuredSize}
          style={[styles.imageCropper, this.state.measuredSize]}
          onTransformDataChange={(data) => (this._transformData = data)}
        />
        <TouchableHighlight
          style={styles.cropButtonTouchable}
          onPress={this._crop.bind(this)}>
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Crop</Text>
          </View>
        </TouchableHighlight>
        {error}
      </View>
    );
  }

  _renderCroppedImage() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Here is the cropped image:</Text>
        <Image
          source={{uri: this.state.croppedImageURI}}
          style={[styles.imageCropper, this.state.measuredSize]}
        />
        <TouchableHighlight
          style={styles.cropButtonTouchable}
          onPress={this._reset.bind(this)}>
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Try again</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  async _crop() {
    try {
      const croppedImageURI = await ImageEditor.cropImage(
        this.state.photo.uri,
        this._transformData,
      );
      if (croppedImageURI) {
        this.setState({croppedImageURI});
      }
    } catch (cropError) {
      this.setState({cropError});
    }
  }

  _reset() {
    this.setState({
      croppedImageURI: null,
      cropError: null,
    });
  }
}

class ImageCropper extends React.Component<$FlowFixMeProps, $FlowFixMeState> {
  _contentOffset: ImageOffset;
  _maximumZoomScale: number;
  _minimumZoomScale: number;
  _scaledImageSize: ImageSize;
  _horizontal: boolean;

  UNSAFE_componentWillMount() {
    // Scale an image to the minimum size that is large enough to completely
    // fill the crop box.
    const widthRatio = this.props.image.width / this.props.size.width;
    const heightRatio = this.props.image.height / this.props.size.height;
    this._horizontal = widthRatio > heightRatio;
    if (this._horizontal) {
      this._scaledImageSize = {
        width: this.props.image.width / heightRatio,
        height: this.props.size.height,
      };
    } else {
      this._scaledImageSize = {
        width: this.props.size.width,
        height: this.props.image.height / widthRatio,
      };
      if (Platform.OS === 'android') {
        // hack to work around Android ScrollView a) not supporting zoom, and
        // b) not supporting vertical scrolling when nested inside another
        // vertical ScrollView (which it is, when displayed inside UIExplorer)
        this._scaledImageSize.width *= 2;
        this._scaledImageSize.height *= 2;
        this._horizontal = true;
      }
    }
    this._contentOffset = {
      x: (this._scaledImageSize.width - this.props.size.width) / 2,
      y: (this._scaledImageSize.height - this.props.size.height) / 2,
    };
    this._maximumZoomScale = Math.min(
      this.props.image.width / this._scaledImageSize.width,
      this.props.image.height / this._scaledImageSize.height,
    );
    this._minimumZoomScale = Math.max(
      this.props.size.width / this._scaledImageSize.width,
      this.props.size.height / this._scaledImageSize.height,
    );
    this._updateTransformData(
      this._contentOffset,
      this._scaledImageSize,
      this.props.size,
    );
  }

  _onScroll(event) {
    this._updateTransformData(
      event.nativeEvent.contentOffset,
      event.nativeEvent.contentSize,
      event.nativeEvent.layoutMeasurement,
    );
  }

  _updateTransformData(offset, scaledImageSize, croppedImageSize) {
    const offsetRatioX = offset.x / scaledImageSize.width;
    const offsetRatioY = offset.y / scaledImageSize.height;
    const sizeRatioX = croppedImageSize.width / scaledImageSize.width;
    const sizeRatioY = croppedImageSize.height / scaledImageSize.height;

    const cropData: ImageCropData = {
      offset: {
        x: this.props.image.width * offsetRatioX,
        y: this.props.image.height * offsetRatioY,
      },
      size: {
        width: this.props.image.width * sizeRatioX,
        height: this.props.image.height * sizeRatioY,
      },
    };
    this.props.onTransformDataChange &&
      this.props.onTransformDataChange(cropData);
  }

  render() {
    return (
      <ScrollView
        alwaysBounceVertical={true}
        automaticallyAdjustContentInsets={false}
        contentOffset={this._contentOffset}
        decelerationRate="fast"
        horizontal={this._horizontal}
        maximumZoomScale={this._maximumZoomScale}
        minimumZoomScale={this._minimumZoomScale}
        onMomentumScrollEnd={this._onScroll.bind(this)}
        onScrollEndDrag={this._onScroll.bind(this)}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={this.props.style}
        scrollEventThrottle={16}>
        <Image
          testID={'testImage'}
          source={this.props.image}
          style={this._scaledImageSize}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    marginTop: 60,
  },
  imageCropper: {
    alignSelf: 'center',
    marginTop: 12,
  },
  cropButtonTouchable: {
    alignSelf: 'center',
    marginTop: 12,
  },
  cropButton: {
    padding: 12,
    backgroundColor: 'blue',
    borderRadius: 4,
  },
  cropButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  text: {
    color: 'white',
  },
});
