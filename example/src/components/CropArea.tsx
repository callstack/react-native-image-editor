import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { colors, radius } from '../theme';

export interface Size {
  width: number;
  height: number;
}

/** Crop rectangle in the original image's pixel coordinates. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Mode = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const MAX_HEIGHT = 420;
const MIN_BOX = 48;
const HANDLE_HIT = 36;

/** Largest rect with the given aspect ratio, centered, covering `fill` of the image. */
export function centeredRect(
  image: Size,
  aspect: number | null,
  fill = 0.8
): CropRect {
  let width = image.width * fill;
  let height = image.height * fill;
  if (aspect) {
    if (width / height > aspect) {
      width = height * aspect;
    } else {
      height = width / aspect;
    }
  }
  return {
    x: Math.round((image.width - width) / 2),
    y: Math.round((image.height - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function CropArea({
  uri,
  headers,
  imageSize,
  rect,
  aspect,
  error,
  onChange,
  onDragStateChange,
}: {
  uri: string;
  headers?: Record<string, string>;
  imageSize: Size | null;
  rect: CropRect | null;
  aspect: number | null;
  error?: string | null;
  onChange: (rect: CropRect) => void;
  /** Lets the parent disable scrolling while the crop box is dragged. */
  onDragStateChange?: (dragging: boolean) => void;
}) {
  const [containerWidth, setContainerWidth] = useState(0);

  const display: Size | null =
    imageSize && containerWidth
      ? (() => {
          const ratio = imageSize.width / imageSize.height;
          let width = containerWidth;
          let height = width / ratio;
          if (height > MAX_HEIGHT) {
            height = MAX_HEIGHT;
            width = height * ratio;
          }
          return { width, height };
        })()
      : null;
  const scale = display && imageSize ? imageSize.width / display.width : 1;

  // PanResponder is created once, so it reads the latest values through refs
  const latest = useRef({
    display,
    scale,
    rect,
    aspect,
    onChange,
    onDragStateChange,
  });
  latest.current = {
    display,
    scale,
    rect,
    aspect,
    onChange,
    onDragStateChange,
  };
  const gesture = useRef<{ mode: Mode; start: CropRect } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      // Only claim touches on the box or a handle, so the page still scrolls
      // when dragging elsewhere on the image
      onStartShouldSetPanResponder: (event) => {
        const { rect: current, scale: s } = latest.current;
        if (!current) {
          return false;
        }
        const box = {
          x: current.x / s,
          y: current.y / s,
          width: current.width / s,
          height: current.height / s,
        };
        const { locationX: px, locationY: py } = event.nativeEvent;
        const near = (x: number, y: number) =>
          Math.abs(px - x) < HANDLE_HIT && Math.abs(py - y) < HANDLE_HIT;
        const right = box.x + box.width;
        const bottom = box.y + box.height;
        let mode: Mode | null = null;
        if (near(box.x, box.y)) {
          mode = 'tl';
        } else if (near(right, box.y)) {
          mode = 'tr';
        } else if (near(box.x, bottom)) {
          mode = 'bl';
        } else if (near(right, bottom)) {
          mode = 'br';
        } else if (px > box.x && px < right && py > box.y && py < bottom) {
          mode = 'move';
        }
        gesture.current = mode ? { mode, start: box } : null;
        return mode !== null;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onDragStateChange?.(true),
      onPanResponderMove: (_, { dx, dy }) => {
        const { display: bounds, scale: s, aspect: ratio } = latest.current;
        if (!gesture.current || !bounds) {
          return;
        }
        const { mode, start } = gesture.current;
        let next: CropRect;

        if (mode === 'move') {
          next = {
            ...start,
            x: clamp(start.x + dx, 0, bounds.width - start.width),
            y: clamp(start.y + dy, 0, bounds.height - start.height),
          };
        } else {
          // Resize around the opposite (anchored) corner
          const sx = mode === 'tr' || mode === 'br' ? 1 : -1;
          const sy = mode === 'bl' || mode === 'br' ? 1 : -1;
          const anchorX = sx > 0 ? start.x : start.x + start.width;
          const anchorY = sy > 0 ? start.y : start.y + start.height;
          const maxW = sx > 0 ? bounds.width - anchorX : anchorX;
          const maxH = sy > 0 ? bounds.height - anchorY : anchorY;
          let width = clamp(start.width + sx * dx, MIN_BOX, maxW);
          let height = clamp(start.height + sy * dy, MIN_BOX, maxH);
          if (ratio) {
            height = width / ratio;
            if (height > maxH) {
              height = maxH;
              width = height * ratio;
            }
          }
          next = {
            x: sx > 0 ? anchorX : anchorX - width,
            y: sy > 0 ? anchorY : anchorY - height,
            width,
            height,
          };
        }

        latest.current.onChange({
          x: Math.round(next.x * s),
          y: Math.round(next.y * s),
          width: Math.round(next.width * s),
          height: Math.round(next.height * s),
        });
      },
      onPanResponderRelease: () => {
        gesture.current = null;
        latest.current.onDragStateChange?.(false);
      },
      onPanResponderTerminate: () => {
        gesture.current = null;
        latest.current.onDragStateChange?.(false);
      },
    })
  ).current;

  const onLayout = (event: LayoutChangeEvent) =>
    setContainerWidth(event.nativeEvent.layout.width);

  const box =
    rect && display
      ? {
          left: rect.x / scale,
          top: rect.y / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        }
      : null;

  return (
    <View onLayout={onLayout} style={styles.container}>
      {error ? (
        <View style={[styles.placeholder, styles.errorBox]}>
          <Text style={styles.errorTitle}>Couldn&apos;t load image</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !display ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.placeholderText}>Loading image…</Text>
        </View>
      ) : (
        <View style={[styles.frame, display]}>
          <Image
            accessibilityIgnoresInvertColors
            testID="cropSourceImage"
            source={{ uri, headers }}
            style={display}
            resizeMode="stretch"
          />
          {box ? (
            <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
              {/* Scrim around the crop box */}
              <View
                pointerEvents="none"
                style={[
                  styles.scrim,
                  { left: 0, top: 0, right: 0, height: box.top },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.scrim,
                  { left: 0, right: 0, top: box.top + box.height, bottom: 0 },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.scrim,
                  {
                    left: 0,
                    top: box.top,
                    width: box.left,
                    height: box.height,
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.scrim,
                  {
                    left: box.left + box.width,
                    right: 0,
                    top: box.top,
                    height: box.height,
                  },
                ]}
              />

              <View pointerEvents="none" style={[styles.box, box]}>
                <View style={[styles.gridV, { left: '33.33%' }]} />
                <View style={[styles.gridV, { left: '66.66%' }]} />
                <View style={[styles.gridH, { top: '33.33%' }]} />
                <View style={[styles.gridH, { top: '66.66%' }]} />
                <View style={[styles.handle, styles.handleTL]} />
                <View style={[styles.handle, styles.handleTR]} />
                <View style={[styles.handle, styles.handleBL]} />
                <View style={[styles.handle, styles.handleBR]} />
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const HANDLE = 22;
const HANDLE_BORDER = 3;
const HANDLE_OFFSET = -HANDLE_BORDER;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  frame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  placeholder: {
    width: '100%',
    height: 260,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: colors.text,
    fontSize: 13,
    textAlign: 'center',
  },
  scrim: {
    position: 'absolute',
    backgroundColor: colors.scrim,
  },
  box: {
    position: 'absolute',
    borderColor: colors.white,
    borderWidth: 1,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    borderColor: colors.white,
  },
  handleTL: {
    left: HANDLE_OFFSET,
    top: HANDLE_OFFSET,
    borderLeftWidth: HANDLE_BORDER,
    borderTopWidth: HANDLE_BORDER,
  },
  handleTR: {
    right: HANDLE_OFFSET,
    top: HANDLE_OFFSET,
    borderRightWidth: HANDLE_BORDER,
    borderTopWidth: HANDLE_BORDER,
  },
  handleBL: {
    left: HANDLE_OFFSET,
    bottom: HANDLE_OFFSET,
    borderLeftWidth: HANDLE_BORDER,
    borderBottomWidth: HANDLE_BORDER,
  },
  handleBR: {
    right: HANDLE_OFFSET,
    bottom: HANDLE_OFFSET,
    borderRightWidth: HANDLE_BORDER,
    borderBottomWidth: HANDLE_BORDER,
  },
});
