import * as Haptics from "expo-haptics";
import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

export type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export interface TouchableWithFeedbackProps extends Omit<TouchableOpacityProps, "onPress"> {
  children?: React.ReactNode;
  onPress?: () => void;
  hapticType?: HapticType;
  disabled?: boolean;
}

const TouchableWithFeedback: React.FC<TouchableWithFeedbackProps> = ({
  children,
  onPress,
  hapticType = "light",
  disabled = false,
  ...props
}) => {
  const handlePress = async () => {
    if (disabled) return;

    // Trigger haptic feedback
    switch (hapticType) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "selection":
        await Haptics.selectionAsync();
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Call the original onPress function
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.7} {...props}>
      {children}
    </TouchableOpacity>
  );
};

export default TouchableWithFeedback;
