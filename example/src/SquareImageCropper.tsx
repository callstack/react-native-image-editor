import React, { Component } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  SafeAreaView,
  ImageURISource,
} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';
import Slider from '@react-native-community/slider';

import type { LayoutChangeEvent } from 'react-native';
import { DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT } from './constants';
import { ImageCropper } from './ImageCropper';

import type { ImageCropData, ImageSize } from './types';

interface State {
  croppedImageURI: string | undefined;
  cropError: Error | null;
  measuredSize: ImageSize | null;
  cropScale: number;
  photo: ImageSize & Pick<ImageURISource, 'uri'>;
}
interface Props {
  // noop
}

export class SquareImageCropper extends Component<Props, State> {
  _transformData: ImageCropData | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      photo: {
        uri: `https://picsum.photos/seed/picsum/${DEFAULT_IMAGE_WIDTH}/${DEFAULT_IMAGE_HEIGHT}`,
        height: DEFAULT_IMAGE_HEIGHT,
        width: DEFAULT_IMAGE_WIDTH,
      },
      measuredSize: null,
      croppedImageURI: undefined,
      cropError: null,
      cropScale: 1,
    };
  }

  _onLayout = (event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (!measuredWidth) {
      return;
    }
    this.setState({
      measuredSize: { width: measuredWidth, height: measuredWidth },
    });
  };

  _onTransformDataChange = (data: ImageCropData) => {
    this._transformData = data;
  };
  render() {
    if (!this.state.measuredSize) {
      return (
        <SafeAreaView style={styles.container} onLayout={this._onLayout} />
      );
    }

    if (!this.state.croppedImageURI) {
      return this._renderImageCropper();
    }

    return this._renderCroppedImage();
  }

  _renderImageCropper() {
    const { photo, cropError, measuredSize } = this.state;

    if (!photo || !measuredSize) {
      return <SafeAreaView style={styles.container} />;
    }

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text} testID="headerText">
          Drag the image within the square to crop
        </Text>
        <ImageCropper
          image={photo}
          size={measuredSize}
          style={[styles.imageCropper, measuredSize]}
          onTransformDataChange={this._onTransformDataChange}
        />
        <View style={styles.scaleSliderContainer}>
          <Text style={styles.text}>
            Scale {this.state.cropScale.toFixed(2)}
          </Text>
          <Slider
            style={styles.scaleSlider}
            minimumValue={0}
            maximumValue={1}
            onValueChange={(cropScale) => this.setState({ cropScale })}
            value={this.state.cropScale}
          />
        </View>

        <TouchableHighlight
          accessibilityRole="button"
          style={styles.cropButtonTouchable}
          onPress={this._crop}
        >
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Crop</Text>
          </View>
        </TouchableHighlight>
        <Text style={styles.errorText}>{cropError?.message}</Text>
      </SafeAreaView>
    );
  }

  _renderCroppedImage() {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Here is the cropped image</Text>
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: this.state.croppedImageURI }}
          style={[styles.imageCropper, this.state.measuredSize]}
        />
        <TouchableHighlight
          accessibilityRole="button"
          style={styles.cropButtonTouchable}
          onPress={this._reset}
        >
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Try again</Text>
          </View>
        </TouchableHighlight>
        <Text style={styles.errorText} />
      </SafeAreaView>
    );
  }

  _crop = async () => {
    try {
      if (!this._transformData) {
        return;
      }
      const displaySize =
        this.state.cropScale !== 1
          ? {
              width: this._transformData?.size.width * this.state.cropScale,
              height: this._transformData?.size.height * this.state.cropScale,
            }
          : undefined;
      const cropData: ImageCropData = {
        ...this._transformData,
        displaySize,
      };
      const { uri } = await ImageEditor.cropImage(
        this.state.photo.uri as string,
        cropData
      );
      if (uri) {
        this.setState({ croppedImageURI: uri });
      }
    } catch (cropError) {
      if (cropError instanceof Error) {
        this.setState({ cropError });
      }
    }
  };

  _reset = () => {
    this.setState({
      croppedImageURI: undefined,
      cropError: null,
      cropScale: 1,
    });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 20,
  },
  imageCropper: {
    alignSelf: 'center',
    marginTop: 12,
  },
  cropButtonTouchable: {
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 'auto',
    backgroundColor: 'royalblue',
    borderRadius: 6,
  },
  cropButton: {
    padding: 12,
  },
  cropButtonLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  text: {
    color: 'black',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  scaleSlider: {
    width: '100%',
  },
  scaleSliderContainer: {
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
  },
});
