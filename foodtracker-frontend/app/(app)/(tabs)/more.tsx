import AddModalPrimaryAction from "@/components/interactions/buttons/addmodalprimaryaction";
import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import { useSession } from "@/hooks/auth";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Tab() {
  const auth = useSession();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText style={styles.title}>More</ThemedText>
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.listItem,
            { borderColor: colors.modalSecondary, backgroundColor: colors.modal },
          ]}
          onPress={() => router.push("/recipes")}
          activeOpacity={0.7}
          testID="more-recipes"
        >
          <ThemedText style={styles.listTitle}>My recipes</ThemedText>
          <ThemedText style={[styles.listSubtitle, { color: colors.icon }]}>
            Search and edit your recipes
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.listItem,
            { borderColor: colors.modalSecondary, backgroundColor: colors.modal },
          ]}
          onPress={() => router.push("/friends")}
          activeOpacity={0.7}
          testID="more-friends"
        >
          <ThemedText style={styles.listTitle}>Friends</ThemedText>
          <ThemedText style={[styles.listSubtitle, { color: colors.icon }]}>
            Find people and share recipes
          </ThemedText>
        </TouchableOpacity>
      </View>
      <AddModalPrimaryAction
        onPress={() => {
          auth.signOut();
        }}
        style={styles.signOutButton}
      >
        <ThemedText>Sign out</ThemedText>
      </AddModalPrimaryAction>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 12,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  section: {
    gap: 8,
  },
  listItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  listSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: "grey",
    alignItems: "center",
  },
});
