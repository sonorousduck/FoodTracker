import AddModalPrimaryAction from "@/components/interactions/buttons/addmodalprimaryaction";
import { useSession } from "@/hooks/auth";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Tab() {
  const auth = useSession();
  return (
    <SafeAreaView style={styles.container}>
      <Text>More</Text>
      <AddModalPrimaryAction
        onPress={() => {
          auth.signOut();
        }}
        style={{
          backgroundColor: "grey",
          alignItems: "center",
        }}
      >
        <Text>Sign out</Text>
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
