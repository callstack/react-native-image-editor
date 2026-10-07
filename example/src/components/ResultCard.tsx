import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { CropResult } from '../types';
import { Badge, Button, InfoRow, Section } from './ui';

export interface CropRun {
  result: CropResult;
  durationMs: number;
  requested: string;
}

/** Keeps the last few path segments; full sandbox paths are long and device specific. */
function shortPath(path: string) {
  const parts = path.split('/');
  return parts.length > 3 ? `…/${parts.slice(-3).join('/')}` : path;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ResultCard({
  run,
  onUseFile,
  onUseBase64,
}: {
  run: CropRun;
  onUseFile: () => void;
  onUseBase64: () => void;
}) {
  const { result, durationMs, requested } = run;
  const ratio = result.width / result.height;

  return (
    <Section
      title="Result"
      subtitle={requested}
      right={<Badge label={`${durationMs} ms`} tone="success" />}
    >
      <View style={styles.preview}>
        <Image
          accessibilityIgnoresInvertColors
          testID="croppedImage"
          source={{ uri: result.uri }}
          style={[styles.image, { aspectRatio: ratio }]}
          resizeMode="contain"
        />
      </View>

      <View>
        <InfoRow
          label="Dimensions"
          value={`${result.width} × ${result.height}`}
        />
        <InfoRow label="Type" value={result.type} />
        <InfoRow label="File size" value={formatBytes(result.size)} />
        <InfoRow label="Name" value={result.name} />
        <InfoRow label="Path" value={shortPath(result.path)} />
        {result.base64 ? (
          <InfoRow
            label="Base64"
            value={`${formatBytes(result.base64.length)} · ${result.base64.slice(0, 32)}…`}
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label="Crop result again"
          variant="secondary"
          onPress={onUseFile}
          style={styles.action}
        />
        <Button
          label="Crop from base64"
          variant="secondary"
          onPress={onUseBase64}
          disabled={!result.base64}
          style={styles.action}
        />
      </View>
      {!result.base64 ? (
        <Text style={styles.hint}>
          Enable “Include base64” to crop from a data: URI.
        </Text>
      ) : null}
    </Section>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    maxHeight: 320,
    borderRadius: radius.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
