import ThemedText from '@/components/themedtext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { RecipeColors } from './recipe-utils';

type BarcodeScanModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onBarcodeScanned: (barcode: string) => void;
  colors: RecipeColors;
};

export default function BarcodeScanModal({
  visible,
  onDismiss,
  onBarcodeScanned,
  colors,
}: BarcodeScanModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);

  // Reset hasScanned when modal becomes visible
  useEffect(() => {
    if (visible) {
      hasScannedRef.current = false;
    }
  }, [visible]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (hasScannedRef.current) {
        return;
      }
      const trimmed = data?.trim();
      if (!trimmed) {
        return;
      }
      hasScannedRef.current = true;
      onBarcodeScanned(trimmed);
    },
    [onBarcodeScanned],
  );

  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  // On native, only render CameraView when visible and permission is granted
  if (Platform.OS !== 'web') {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.modal },
          ]}
          testID="barcode-scan-modal"
        >
          <ThemedText style={styles.modalTitle}>Scan barcode</ThemedText>

          {!permission ? (
            <ActivityIndicator
              size="large"
              color={colors.tint}
              style={styles.loadingContainer}
            />
          ) : !permission.granted ? (
            <View
              style={[
                styles.cameraWrapper,
                { backgroundColor: colors.modalSecondary },
              ]}
            >
              <ThemedText style={styles.permissionText}>
                Camera access is needed to scan barcodes.
              </ThemedText>
              <View style={{ marginTop: 16 }}>
                <ThemedText
                  style={[
                    styles.enableButton,
                    { color: colors.tint },
                  ]}
                  onPress={handleRequestPermission}
                >
                  Enable Camera
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.overlay}>
                <View style={[styles.focusBox, { borderColor: colors.tint }]} />
                <ThemedText style={styles.overlayText}>
                  Align the barcode inside the frame
                </ThemedText>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    );
  }

  // Web: show not supported message
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.modal },
        ]}
        testID="barcode-scan-modal"
      >
        <ThemedText style={styles.modalTitle}>Scan barcode</ThemedText>
        <View
          style={[
            styles.cameraWrapper,
            { backgroundColor: colors.modalSecondary },
          ]}
        >
          <ThemedText style={styles.unsupportedText}>
            Barcode scanning is not supported on web. Please use a mobile
            device.
          </ThemedText>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    alignSelf: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 512,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cameraWrapper: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 16,
  },
  enableButton: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  unsupportedText: {
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
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
    color: '#ffffff',
  },
});
