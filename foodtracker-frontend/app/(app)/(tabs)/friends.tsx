import DuckTextInput from "@/components/interactions/inputs/textinput";
import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import {
  acceptFriendRequest,
  getFriends,
  getPendingFriendRequests,
  rejectFriendRequest,
  requestFriend,
  searchFriends,
} from "@/lib/api/friends";
import { FriendProfile } from "@/types/friends/friendprofile";
import { FriendRequest } from "@/types/friends/friendrequest";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export default function FriendsTab() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const canSearch = useMemo(
    () => firstName.trim().length > 0 || lastName.trim().length > 0,
    [firstName, lastName],
  );

  const loadFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        getFriends(),
        getPendingFriendRequests(),
      ]);
      setFriends(friendsResponse);
      setPendingRequests(requestsResponse);
    } catch (error) {
      setFriends([]);
      setPendingRequests([]);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends]),
  );

  const handleSearch = async () => {
    if (!canSearch) {
      Alert.alert("Add a name", "Enter a first or last name to search.");
      return;
    }
    setIsSearching(true);
    try {
      const response = await searchFriends({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setSearchResults(response);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestFriend = async (userId: number) => {
    try {
      await requestFriend(userId);
      setSearchResults((prev) => prev.filter((user) => user.id !== userId));
      await loadFriends();
    } catch (error) {
      Alert.alert("Error", "Could not send friend request.");
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      await loadFriends();
    } catch (error) {
      Alert.alert("Error", "Could not accept friend request.");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      await loadFriends();
    } catch (error) {
      Alert.alert("Error", "Could not reject friend request.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText style={styles.title}>Friends</ThemedText>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Find friends</ThemedText>
        <DuckTextInput
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          containerStyle={styles.inputSpacing}
          testID="friends-first-name"
        />
        <DuckTextInput
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          testID="friends-last-name"
        />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.tint, opacity: canSearch ? 1 : 0.6 },
          ]}
          onPress={handleSearch}
          disabled={!canSearch || isSearching}
          testID="friends-search"
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Search</ThemedText>
          )}
        </TouchableOpacity>

        {searchResults.length > 0 ? (
          <View style={styles.list}>
            {searchResults.map((user) => (
              <View
                key={user.id}
                style={[
                  styles.card,
                  { borderColor: colors.modalSecondary, backgroundColor: colors.modal },
                ]}
              >
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle}>
                    {user.firstName} {user.lastName}
                  </ThemedText>
                  <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
                    {user.email}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.modalSecondary }]}
                  onPress={() => handleRequestFriend(user.id)}
                  activeOpacity={0.7}
                  testID={`friend-request-${user.id}`}
                >
                  <ThemedText style={styles.secondaryButtonText}>Add friend</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Requests</ThemedText>
        {isLoadingFriends ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : pendingRequests.length === 0 ? (
          <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
            No pending requests.
          </ThemedText>
        ) : (
          pendingRequests.map((request) => (
            <View
              key={request.id}
              style={[
                styles.card,
                { borderColor: colors.modalSecondary, backgroundColor: colors.modal },
              ]}
            >
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>
                  {request.requester.firstName} {request.requester.lastName}
                </ThemedText>
                <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
                  {request.requester.email}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { borderColor: colors.modalSecondary },
                  ]}
                  onPress={() => handleAcceptRequest(request.id)}
                  activeOpacity={0.7}
                  testID={`friend-accept-${request.id}`}
                >
                  <ThemedText style={styles.secondaryButtonText}>Accept</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { borderColor: colors.modalSecondary },
                  ]}
                  onPress={() => handleRejectRequest(request.id)}
                  activeOpacity={0.7}
                  testID={`friend-reject-${request.id}`}
                >
                  <ThemedText style={styles.secondaryButtonText}>Reject</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>My friends</ThemedText>
        {isLoadingFriends ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : friends.length === 0 ? (
          <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
            No friends yet.
          </ThemedText>
        ) : (
          friends.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={[
                styles.card,
                { borderColor: colors.modalSecondary, backgroundColor: colors.modal },
              ]}
              onPress={() => router.push({ pathname: "/friend", params: { id: String(friend.id) } })}
              activeOpacity={0.7}
              testID={`friend-open-${friend.id}`}
            >
              <ThemedText style={styles.cardTitle}>
                {friend.firstName} {friend.lastName}
              </ThemedText>
              <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
                {friend.email}
              </ThemedText>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 160,
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  inputSpacing: {
    marginBottom: 8,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  list: {
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 12,
  },
  loading: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
