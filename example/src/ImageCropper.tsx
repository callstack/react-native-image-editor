import React, {Component} from 'react';
import {Image, Platform, ScrollView} from 'react-native';

import type {ImageSourcePropType, StyleProp, ViewStyle} from 'react-native';
import type {ImageCropData, ImageOffset, ImageSize} from './types';
import {NativeSyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {NativeScrollEvent} from 'react-native/Libraries/Components/ScrollView/ScrollView';

export interface ImageCropperProps {
  image: ImageSize & ImageSourcePropType;
  size: ImageSize;
  onTransformDataChange?: (data: ImageCropData) => void;
  style?: StyleProp<ViewStyle>;
}

export class ImageCropper extends Component<ImageCropperProps> {
  _contentOffset: ImageOffset;
  _scaledImageSize: ImageSize;
  _maximumZoomScale: number;
  _minimumZoomScale: number;
  _horizontal: boolean;

  constructor(props: ImageCropperProps) {
    super(props);

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

  _onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this._updateTransformData(
      event.nativeEvent.contentOffset,
      event.nativeEvent.contentSize,
      event.nativeEvent.layoutMeasurement,
    );
  };

  _updateTransformData(
    offset: NativeScrollEvent['contentOffset'],
    scaledImageSize: NativeScrollEvent['contentSize'],
    croppedImageSize: NativeScrollEvent['layoutMeasurement'],
  ) {
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
    this.props.onTransformDataChange?.(cropData);
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
        onMomentumScrollEnd={this._onScroll}
        onScrollEndDrag={this._onScroll}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={this.props.style}
        scrollEventThrottle={16}>
        <Image
          testID="testImage"
          source={this.props.image}
          style={this._scaledImageSize}
        />
      </ScrollView>
    );
  }
}
