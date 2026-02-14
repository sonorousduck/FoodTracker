import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanBarcode() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  const backgroundStyle = useMemo(
    () => [{ backgroundColor: colors.background }, styles.container],
    [colors.background],
  );

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (hasScanned) {
        return;
      }
      const trimmed = data?.trim();
      if (!trimmed) {
        return;
      }
      setHasScanned(true);
      router.replace({ pathname: "/logfood", params: { barcode: trimmed } });
    },
    [hasScanned, router],
  );

  if (!permission) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <ActivityIndicator color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.permissionContainer}>
          <ThemedText style={styles.permissionTitle}>
            Camera access is needed to scan barcodes.
          </ThemedText>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.tint }]}
            onPress={requestPermission}
          >
            <ThemedText style={styles.permissionButtonText}>
              Enable Camera
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  permissionContainer: {
    alignItems: "center",
    gap: 16,
  },
  permissionTitle: {
    fontSize: 16,
    textAlign: "center",
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontWeight: "600",
    color: "#fff",
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
  },
});
