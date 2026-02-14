import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import createElement from 'react-native-web/dist/exports/createElement';

const Video = (props: Record<string, unknown>) => createElement('video', props);

export default function ScanBarcode() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannedRef = useRef(false);

  const handleScan = useCallback(
    (data: string) => {
      if (scannedRef.current) return;
      const trimmed = data.trim();
      if (!trimmed) return;
      scannedRef.current = true;
      router.replace({ pathname: '/logfood', params: { barcode: trimmed } });
    },
    [router],
  );

  useEffect(() => {
    if (!videoElement) return;

    const reader = new BrowserMultiFormatReader();
    let isUnmounted = false;
    let controls: { stop: () => void } | null = null;

    reader
      .decodeFromVideoDevice(undefined, videoElement, (result, _error, ctrl) => {
        if (isUnmounted) {
          ctrl.stop();
          return;
        }
        if (result) {
          ctrl.stop();
          handleScan(result.getText());
        }
      })
      .then((ctrl) => {
        controls = ctrl;
        if (isUnmounted) {
          ctrl.stop();
          return;
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        if (isUnmounted) return;
        setLoading(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
        }
      });

    return () => {
      isUnmounted = true;
      controls?.stop();
    };
  }, [videoElement, handleScan]);

  const backgroundStyle = [{ backgroundColor: colors.background }, styles.container];

  if (permissionDenied) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.permissionContainer}>
          <ThemedText style={styles.permissionTitle}>
            Camera access is needed to scan barcodes. Please allow camera access in your browser
            settings.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <View style={styles.cameraWrapper}>
        {/* @ts-ignore: web-only video element via react-native-web createElement */}
        <Video
          ref={setVideoElement}
          autoPlay
          playsInline
          muted
          style={[StyleSheet.absoluteFill, styles.video]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: {
    objectFit: 'cover',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 64,
  },
  focusBox: {
    width: 220,
    height: 140,
    borderWidth: 2,
    borderRadius: 12,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});
