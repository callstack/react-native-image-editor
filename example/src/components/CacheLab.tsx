import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import ImageEditor from '@react-native-community/image-editor';

import { INVALID_IMAGE_URI, randomImageUri } from '../sources';
import { colors, radius, spacing } from '../theme';
import { formatBytes } from './ResultCard';
import { Badge, Button, Section } from './ui';

type Tone = 'neutral' | 'success' | 'danger' | 'accent';

interface LogEntry {
  id: number;
  title: string;
  detail: string;
  tone: Tone;
}

let nextId = 0;

const CROP = { offset: { x: 200, y: 100 }, size: { width: 800, height: 600 } };

export function CacheLab() {
  const [uri, setUri] = useState(randomImageUri);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [imageStart, setImageStart] = useState(0);

  const push = (title: string, detail: string, tone: Tone = 'neutral') =>
    setLog((entries) =>
      [...entries, { id: nextId++, title, detail, tone }].slice(-8)
    );

  const run = async (name: string, task: () => Promise<void>) => {
    setBusy(name);
    try {
      await task();
    } catch (error) {
      push(
        name,
        error instanceof Error ? error.message : String(error),
        'danger'
      );
    } finally {
      setBusy(null);
    }
  };

  const timed = async <T,>(task: () => Promise<T>) => {
    const start = Date.now();
    const value = await task();
    return { value, ms: Date.now() - start };
  };

  const newUrl = () => {
    setUri(randomImageUri());
    setShowImage(false);
    setLog([]);
  };

  const queryCache = () =>
    run('Query cache', async () => {
      const result = (await Image.queryCache?.([uri])) ?? {};
      const status = result[uri];
      push(
        'Image.queryCache',
        status ? `cached in ${status}` : 'not cached',
        status ? 'success' : 'neutral'
      );
    });

  const prefetch = () =>
    run('Prefetch', async () => {
      const { ms } = await timed(() => Image.prefetch(uri));
      push('Image.prefetch', `done in ${ms} ms`, 'accent');
    });

  const crop = () =>
    run('Crop', async () => {
      const { value, ms } = await timed(() => ImageEditor.cropImage(uri, CROP));
      push(
        'cropImage (not displayed)',
        `${value.width}×${value.height}, ${formatBytes(value.size)} in ${ms} ms`,
        'success'
      );
    });

  const cropInvalid = () =>
    run('Invalid URL', async () => {
      try {
        await ImageEditor.cropImage(INVALID_IMAGE_URI, CROP);
        push('cropImage invalid URL', 'unexpectedly resolved', 'danger');
      } catch (error) {
        push(
          'cropImage invalid URL',
          `rejected as expected: ${error instanceof Error ? error.message : String(error)}`,
          'accent'
        );
      }
    });

  const toggleImage = () => {
    setImageStart(Date.now());
    setShowImage((shown) => !shown);
  };

  return (
    <Section
      title="Cache lab"
      subtitle="Check that cropImage shares the native image cache with <Image>"
      right={
        <Badge
          label={Platform.OS === 'ios' ? 'iOS' : 'Android'}
          tone="accent"
        />
      }
    >
      <View style={styles.urlBox}>
        <Text style={styles.urlLabel}>Fresh URL (not cached yet)</Text>
        <Text style={styles.url} selectable numberOfLines={1}>
          {uri}
        </Text>
      </View>

      <View style={styles.grid}>
        <Button
          label="New URL"
          variant="secondary"
          onPress={newUrl}
          style={styles.cell}
        />
        <Button
          label="Query cache"
          variant="secondary"
          onPress={queryCache}
          loading={busy === 'Query cache'}
          style={styles.cell}
        />
        <Button
          label="Prefetch"
          variant="secondary"
          onPress={prefetch}
          loading={busy === 'Prefetch'}
          style={styles.cell}
        />
        <Button
          label="Crop"
          variant="secondary"
          onPress={crop}
          loading={busy === 'Crop'}
          style={styles.cell}
        />
        <Button
          label={showImage ? 'Hide image' : 'Show image'}
          variant="secondary"
          onPress={toggleImage}
          style={styles.cell}
        />
        <Button
          label="Invalid URL"
          variant="secondary"
          onPress={cropInvalid}
          loading={busy === 'Invalid URL'}
          style={styles.cell}
        />
      </View>

      <Text style={styles.recipe}>
        Try: Query → Prefetch → Crop (fast, no download) · or New URL → Crop →
        Query → Show image (an {'<Image>'}, loads from the cache cropImage
        filled)
      </Text>

      {showImage ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri }}
          style={styles.image}
          onLoad={() =>
            push('<Image> onLoad', `${Date.now() - imageStart} ms`, 'success')
          }
          onError={({ nativeEvent }) =>
            push('<Image> onError', String(nativeEvent.error), 'danger')
          }
        />
      ) : null}

      {log.length ? (
        <View style={styles.log}>
          {log.map((entry) => (
            <View key={entry.id} style={styles.logRow}>
              <View style={[styles.dot, dotTones[entry.tone]]} />
              <View style={styles.flex}>
                <Text style={styles.logTitle}>{entry.title}</Text>
                <Text style={styles.logDetail} numberOfLines={3}>
                  {entry.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Section>
  );
}

const dotTones = StyleSheet.create({
  neutral: { backgroundColor: colors.muted },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.danger },
  accent: { backgroundColor: colors.accent },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  urlBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  urlLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  url: {
    color: colors.text,
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingHorizontal: spacing.sm,
  },
  recipe: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  log: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  logTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  logDetail: {
    color: colors.muted,
    fontSize: 12,
  },
});
