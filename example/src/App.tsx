import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import ImageEditor from '@react-native-community/image-editor';

import { CacheLab } from './components/CacheLab';
import { CropArea, centeredRect } from './components/CropArea';
import type { CropRect, Size } from './components/CropArea';
import { ResultCard } from './components/ResultCard';
import type { CropRun } from './components/ResultCard';
import {
  Button,
  Field,
  Section,
  Segmented,
  Stepper,
  ToggleRow,
} from './components/ui';
import type { SegmentOption } from './components/ui';
import { PRESET_SOURCES } from './sources';
import type { ImageSource } from './sources';
import { colors, radius, spacing } from './theme';
import type { ImageCropData } from './types';

type Format = 'auto' | NonNullable<ImageCropData['format']>;
type ResizeMode = NonNullable<ImageCropData['resizeMode']>;

const ASPECTS: SegmentOption<number | null>[] = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
];

const FORMATS: SegmentOption<Format>[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'WebP', value: 'webp' },
];

const RESIZE_MODES: SegmentOption<ResizeMode>[] = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' },
  { label: 'Stretch', value: 'stretch' },
  { label: 'Center', value: 'center' },
];

function getImageSize(source: ImageSource): Promise<Size> {
  return source.headers
    ? Image.getSizeWithHeaders(source.uri, source.headers)
    : Image.getSize(source.uri);
}

function describeSource(source: ImageSource) {
  if (source.uri.startsWith('data:')) {
    return 'data: URI';
  }
  if (source.uri.startsWith('file:')) {
    return 'file:// URI';
  }
  return source.label;
}

function Playground() {
  const insets = useSafeAreaInsets();

  const [source, setSource] = useState<ImageSource>(PRESET_SOURCES[0]!);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);

  const [format, setFormat] = useState<Format>('auto');
  const [quality, setQuality] = useState(0.9);
  const [includeBase64, setIncludeBase64] = useState(false);
  const [resize, setResize] = useState(false);
  const [displayWidth, setDisplayWidth] = useState(400);
  const [displayHeight, setDisplayHeight] = useState(400);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('cover');

  const [dragging, setDragging] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [run, setRun] = useState<CropRun | null>(null);

  useEffect(() => {
    let cancelled = false;
    setImageSize(null);
    setLoadError(null);
    setRect(null);
    const load = async () => {
      try {
        const size = await getImageSize(source);
        if (!cancelled) {
          setImageSize(size);
          setRect(centeredRect(size, aspect));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // The crop box is only re-centered for a new source, not on aspect change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const changeAspect = (value: number | null) => {
    setAspect(value);
    if (imageSize) {
      setRect(centeredRect(imageSize, value));
    }
  };

  const crop = async () => {
    if (!rect) {
      return;
    }
    const cropData: ImageCropData = {
      offset: { x: rect.x, y: rect.y },
      size: { width: rect.width, height: rect.height },
      quality,
      includeBase64,
      ...(format !== 'auto' && { format }),
      ...(resize && {
        displaySize: { width: displayWidth, height: displayHeight },
        resizeMode,
      }),
      ...(source.headers && { headers: source.headers }),
    };

    setCropping(true);
    setCropError(null);
    const start = Date.now();
    try {
      const result = await ImageEditor.cropImage(source.uri, cropData);
      setRun({
        result,
        durationMs: Date.now() - start,
        requested: `${describeSource(source)} · ${rect.width}×${rect.height} at (${rect.x}, ${rect.y})`,
      });
    } catch (error) {
      setCropError(error instanceof Error ? error.message : String(error));
    } finally {
      setCropping(false);
    }
  };

  const useResultFile = () => {
    if (run) {
      setSource({
        key: 'file',
        label: 'Last result',
        description: 'Local file:// written by the previous crop',
        uri: run.result.uri,
      });
    }
  };

  const useResultBase64 = () => {
    if (run?.result.base64) {
      setSource({
        key: 'base64',
        label: 'Base64',
        description: 'data: URI built from the previous result',
        uri: `data:${run.result.type};base64,${run.result.base64}`,
      });
    }
  };

  const sourceOptions: SegmentOption<string>[] = PRESET_SOURCES.map((s) => ({
    label: s.label,
    value: s.key,
  }));

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!dragging}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>@react-native-community</Text>
          <Text style={styles.title}>Image Editor</Text>
          <Text style={styles.subtitle}>
            Crop, scale and re-encode images natively on{' '}
            {Platform.OS === 'ios' ? 'iOS' : 'Android'}.
          </Text>
        </View>

        <Section title="Source" subtitle={source.description}>
          <Segmented
            testID="sourcePicker"
            options={sourceOptions}
            value={source.key}
            onChange={(key) =>
              setSource(PRESET_SOURCES.find((s) => s.key === key) ?? source)
            }
          />
          {source.headers ? (
            <View style={styles.code}>
              {Object.entries(source.headers).map(([key, value]) => (
                <Text key={key} style={styles.codeText}>
                  {key}: {value}
                </Text>
              ))}
            </View>
          ) : null}
        </Section>

        <Section
          title="Crop area"
          subtitle="Drag the box to move it, drag a corner to resize"
        >
          <CropArea
            uri={source.uri}
            headers={source.headers}
            imageSize={imageSize}
            rect={rect}
            aspect={aspect}
            error={loadError}
            onChange={setRect}
            onDragStateChange={setDragging}
          />
          <Field label="Aspect ratio">
            <Segmented
              options={ASPECTS}
              value={aspect}
              onChange={changeAspect}
            />
          </Field>
          {imageSize && rect ? (
            <View style={styles.stats}>
              <Stat
                label="Image"
                value={`${imageSize.width}×${imageSize.height}`}
              />
              <Stat label="Offset" value={`${rect.x}, ${rect.y}`} />
              <Stat label="Size" value={`${rect.width}×${rect.height}`} />
            </View>
          ) : null}
        </Section>

        <Section title="Output" subtitle="Options passed to cropImage">
          <Field
            label="Format"
            hint={
              Platform.OS === 'ios'
                ? 'WebP falls back to JPEG on iOS'
                : undefined
            }
          >
            <Segmented options={FORMATS} value={format} onChange={setFormat} />
          </Field>
          <Field label="Quality" hint="JPEG / WebP only">
            <Stepper
              value={quality}
              onChange={(value) => setQuality(Math.round(value * 10) / 10)}
              step={0.1}
              min={0}
              max={1}
              format={(value) => value.toFixed(1)}
            />
          </Field>
          <ToggleRow
            label="Include base64"
            hint="Return the encoded image as a base64 string"
            value={includeBase64}
            onChange={setIncludeBase64}
          />
          <ToggleRow
            label="Scale output (displaySize)"
            hint="Resize the cropped image to a target size"
            value={resize}
            onChange={setResize}
          />
          {resize ? (
            <>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Field label="Width">
                    <Stepper
                      value={displayWidth}
                      onChange={setDisplayWidth}
                      step={50}
                      min={50}
                      max={4000}
                    />
                  </Field>
                </View>
                <View style={styles.flex}>
                  <Field label="Height">
                    <Stepper
                      value={displayHeight}
                      onChange={setDisplayHeight}
                      step={50}
                      min={50}
                      max={4000}
                    />
                  </Field>
                </View>
              </View>
              <Field
                label="Resize mode"
                hint={
                  Platform.OS === 'android' ? 'Applied on iOS only' : undefined
                }
              >
                <Segmented
                  options={RESIZE_MODES}
                  value={resizeMode}
                  onChange={setResizeMode}
                />
              </Field>
            </>
          ) : null}
        </Section>

        <Button
          testID="cropButton"
          label="Crop image"
          onPress={crop}
          loading={cropping}
          disabled={!rect}
          style={styles.cropButton}
        />
        {cropError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText} numberOfLines={4}>
              {cropError}
            </Text>
          </View>
        ) : null}

        {run ? (
          <ResultCard
            run={run}
            onUseFile={useResultFile}
            onUseBase64={useResultBase64}
          />
        ) : null}

        <CacheLab />
      </ScrollView>
      {/* Keeps scrolled content from showing through the status bar */}
      <View
        pointerEvents="none"
        style={[styles.statusBarScrim, { height: insets.top }]}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Playground />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
  },
  code: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  codeText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  cropButton: {
    marginBottom: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
});
