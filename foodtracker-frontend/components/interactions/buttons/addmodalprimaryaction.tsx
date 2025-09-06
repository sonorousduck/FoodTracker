import { StyleSheet, Text } from "react-native";

import TouchableWithFeedback, { TouchableWithFeedbackProps } from "./touchablewithfeedback";

interface AddModalPrimaryActionProps extends TouchableWithFeedbackProps {
  children?: React.ReactNode;
}

export default function AddModalPrimaryAction({ children, style, ...props }: AddModalPrimaryActionProps) {
  return (
    <TouchableWithFeedback style={[styles.button, style]} {...props}>
      {children || <Text>Unused</Text>}
    </TouchableWithFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 120,
    minWidth: 120,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignContent: "center",
  },
});
