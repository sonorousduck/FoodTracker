import DuckTextInput from '@/components/interactions/inputs/textinput';
import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { getRecipes } from '@/lib/api/recipe';
import { Recipe } from '@/types/recipe/recipe';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const searchDelayMs = 350;

export default function Recipes() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadRecipes = useCallback(
    async (query?: string) => {
      setIsLoading(true);
      try {
        const results = await getRecipes({
          search: query?.trim() ? query.trim() : undefined,
          limit: 50,
        });
        setRecipes(results);
      } catch (error) {
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadRecipes(searchQuery);
    }, [loadRecipes, searchQuery]),
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRecipes(searchQuery);
    }, searchDelayMs);

    return () => clearTimeout(timeoutId);
  }, [loadRecipes, searchQuery]);

  const renderItem = ({ item }: { item: Recipe }) => {
    const ingredientCount = item.ingredients?.length ?? 0;
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { borderColor: colors.modalSecondary, backgroundColor: colors.modal },
        ]}
        activeOpacity={0.7}
        onPress={() =>
          router.push({ pathname: '/recipe', params: { id: String(item.id) } })
        }
        testID={`recipe-list-item-${item.id}`}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardText}>
            <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
              {ingredientCount} ingredients · {item.servings}{' '}
              {item.servings === 1 ? 'serving' : 'servings'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>My recipes</ThemedText>
        <DuckTextInput
          label="Search recipes"
          placeholder="Search recipes"
          value={searchQuery}
          onChangeText={setSearchQuery}
          enterKeyHint="search"
          autoCapitalize="none"
        />
      </View>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.tint} />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={{ color: colors.icon }}>
            No recipes yet. Create one to get started.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 8,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
    gap: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
