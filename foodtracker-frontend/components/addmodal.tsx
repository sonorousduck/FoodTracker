import { Colors } from "@/constants/Colors";
import { BlurView } from "expo-blur";
import { PropsWithChildren, useEffect } from "react";
import React from "react";
import { Dimensions, Modal, Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.4;

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
}>;

export default function AddModal({ isVisible, children, onClose }: Props) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const backdropOpacity = useSharedValue(0);
  const colorScheme = useColorScheme();

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow downward swipes
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        // Fade out the modal as it's swiped down
        opacity.value = Math.max(0.3, 1 - event.translationY / (MODAL_HEIGHT * 0.5));
        // Also fade out the backdrop
        backdropOpacity.value = Math.max(0, 1 - event.translationY / (MODAL_HEIGHT * 0.5));
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > MODAL_HEIGHT * 0.25 || event.velocityY > 500;

      if (shouldClose) {
        // Animate out and close
        translateY.value = withSpring(MODAL_HEIGHT, { damping: 20 });
        opacity.value = withSpring(0, { damping: 20 });
        backdropOpacity.value = withSpring(0, { damping: 20 });
        runOnJS(onClose)();
      } else {
        // Spring back to original position
        translateY.value = withSpring(0, { damping: 20 });
        opacity.value = withSpring(1, { damping: 20 });
        backdropOpacity.value = withSpring(1, { damping: 20 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  // Reset animation values when modal visibility changes
  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withSpring(1, { damping: 20 });
      backdropOpacity.value = withSpring(1, { damping: 20 });
    } else {
      backdropOpacity.value = 0;
    }
  }, [isVisible, translateY, opacity, backdropOpacity]);

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}></Pressable>
          </BlurView>
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.modalContent,
              animatedStyle,
              { backgroundColor: Colors[colorScheme ?? "light"].modal },
              styles.shadow,
            ]}
          >
            {/* Add a drag indicator */}
            <View
              style={[
                styles.dragIndicator,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].modalSecondary,
                },
              ]}
            />
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    height: "60%",
    width: "100%",
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    paddingTop: 8,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  dragIndicator: {
    alignSelf: "center",
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    color: "#fff",
    fontSize: 16,
  },
});
