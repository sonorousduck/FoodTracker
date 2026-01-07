import ThemedText from "@/components/themedtext";
import AddModalPrimaryAction from "@/components/interactions/buttons/addmodalprimaryaction";
import { useSession } from "@/hooks/auth";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Tab() {
  const auth = useSession();
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText>More</ThemedText>
      <AddModalPrimaryAction
        onPress={() => {
          auth.signOut();
        }}
        style={{
          backgroundColor: "grey",
          alignItems: "center",
        }}
      >
        <ThemedText>Sign out</ThemedText>
      </AddModalPrimaryAction>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
