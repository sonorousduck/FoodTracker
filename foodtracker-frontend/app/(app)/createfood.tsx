import FoodEntryModal from '@/components/foodentry/foodentrymodal';
import DuckTextInput from '@/components/interactions/inputs/textinput';
import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { isAxiosError } from '@/lib/api';
import { createFood } from '@/lib/api/food';
import { createBarcodeMapping } from '@/lib/api/foodbarcode';
import { createFoodEntry } from '@/lib/api/foodentry';
import { CreateFoodDto } from '@/types/food/createfood';
import { Food } from '@/types/food/food';
import { MealType } from '@/types/foodentry/updatefoodentry';
import { HeaderHeightContext } from '@react-navigation/elements';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdvancedNumberKey, AdvancedNumberState } from '@/types/createfood.types';

const advancedFieldList: Array<{
  key: AdvancedNumberKey;
  label: string;
  helper?: string;
}> = [
  { key: 'fiber', label: 'Fiber (g)' },
  { key: 'sugar', label: 'Sugar (g)' },
  { key: 'sodium', label: 'Sodium (mg)' },
  { key: 'saturatedFat', label: 'Saturated fat (g)' },
  { key: 'transFat', label: 'Trans fat (g)' },
  { key: 'cholesterol', label: 'Cholesterol (mg)' },
  { key: 'addedSugar', label: 'Added sugar (g)' },
  { key: 'netCarbs', label: 'Net carbs (g)' },
  { key: 'solubleFiber', label: 'Soluble fiber (g)' },
  { key: 'insolubleFiber', label: 'Insoluble fiber (g)' },
  { key: 'water', label: 'Water (g)' },
  { key: 'pralScore', label: 'PRAL score' },
  { key: 'omega3', label: 'Omega 3 (mg)' },
  { key: 'omega6', label: 'Omega 6 (mg)' },
  { key: 'calcium', label: 'Calcium (mg)' },
  { key: 'iron', label: 'Iron (mg)' },
  { key: 'potassium', label: 'Potassium (mg)' },
  { key: 'magnesium', label: 'Magnesium (mg)' },
  { key: 'vitaminAiu', label: 'Vitamin A (IU)' },
  { key: 'vitaminArae', label: 'Vitamin A (RAE mcg)' },
  { key: 'vitaminC', label: 'Vitamin C (mg)' },
  { key: 'vitaminB12', label: 'Vitamin B12 (mcg)' },
  { key: 'vitaminD', label: 'Vitamin D (mcg)' },
  { key: 'vitaminE', label: 'Vitamin E (mg)' },
  { key: 'phosphorus', label: 'Phosphorus (mg)' },
  { key: 'zinc', label: 'Zinc (mg)' },
  { key: 'copper', label: 'Copper (mg)' },
  { key: 'manganese', label: 'Manganese (mg)' },
  { key: 'selenium', label: 'Selenium (mcg)' },
  { key: 'fluoride', label: 'Fluoride (mcg)' },
  { key: 'molybdenum', label: 'Molybdenum (mcg)' },
  { key: 'chlorine', label: 'Chlorine (mg)' },
  { key: 'vitaminB1', label: 'Vitamin B1 (mg)' },
  { key: 'vitaminB2', label: 'Vitamin B2 (mg)' },
  { key: 'vitaminB3', label: 'Vitamin B3 (mg)' },
  { key: 'vitaminB5', label: 'Vitamin B5 (mg)' },
  { key: 'vitaminB6', label: 'Vitamin B6 (mg)' },
  { key: 'biotin', label: 'Biotin (mcg)' },
  { key: 'folate', label: 'Folate (mcg)' },
  { key: 'folicAcid', label: 'Folic acid (mcg)' },
  { key: 'foodFolate', label: 'Food folate (mcg)' },
  { key: 'folateDfe', label: 'Folate DFE (mcg)' },
  { key: 'choline', label: 'Choline (mg)' },
  { key: 'betaine', label: 'Betaine (mg)' },
  { key: 'retinol', label: 'Retinol (mcg)' },
  { key: 'caroteneBeta', label: 'Carotene beta (mcg)' },
  { key: 'caroteneAlpha', label: 'Carotene alpha (mcg)' },
  { key: 'lycopene', label: 'Lycopene (mcg)' },
  { key: 'luteinZeaxanthin', label: 'Lutein + Zeaxanthin (mcg)' },
  { key: 'vitaminD2', label: 'Vitamin D2 (mcg)' },
  { key: 'vitaminD3', label: 'Vitamin D3 (mcg)' },
  { key: 'vitaminDiu', label: 'Vitamin D (IU)' },
  { key: 'vitaminK', label: 'Vitamin K (mcg)' },
  { key: 'dihydrophylloquinone', label: 'Dihydrophylloquinone (mcg)' },
  { key: 'menaquinone4', label: 'Menaquinone-4 (mcg)' },
  { key: 'monoFat', label: 'Monounsaturated fat (mg)' },
  { key: 'polyFat', label: 'Polyunsaturated fat (mg)' },
  { key: 'ala', label: 'ALA (mg)' },
  { key: 'epa', label: 'EPA (mg)' },
  { key: 'dpa', label: 'DPA (mg)' },
  { key: 'dha', label: 'DHA (mg)' },
];

const buildEmptyAdvancedNumbers = (): AdvancedNumberState => ({
  fiber: '',
  sugar: '',
  sodium: '',
  saturatedFat: '',
  transFat: '',
  cholesterol: '',
  addedSugar: '',
  netCarbs: '',
  solubleFiber: '',
  insolubleFiber: '',
  water: '',
  pralScore: '',
  omega3: '',
  omega6: '',
  calcium: '',
  iron: '',
  potassium: '',
  magnesium: '',
  vitaminAiu: '',
  vitaminArae: '',
  vitaminC: '',
  vitaminB12: '',
  vitaminD: '',
  vitaminE: '',
  phosphorus: '',
  zinc: '',
  copper: '',
  manganese: '',
  selenium: '',
  fluoride: '',
  molybdenum: '',
  chlorine: '',
  vitaminB1: '',
  vitaminB2: '',
  vitaminB3: '',
  vitaminB5: '',
  vitaminB6: '',
  biotin: '',
  folate: '',
  folicAcid: '',
  foodFolate: '',
  folateDfe: '',
  choline: '',
  betaine: '',
  retinol: '',
  caroteneBeta: '',
  caroteneAlpha: '',
  lycopene: '',
  luteinZeaxanthin: '',
  vitaminD2: '',
  vitaminD3: '',
  vitaminDiu: '',
  vitaminK: '',
  dihydrophylloquinone: '',
  menaquinone4: '',
  monoFat: '',
  polyFat: '',
  ala: '',
  epa: '',
  dpa: '',
  dha: '',
});

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseRequiredNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const parseOptionalNumberWithFallback = (
  value: string,
  fallback: number,
): number => {
  const parsed = parseOptionalNumber(value);
  if (parsed === undefined) {
    return fallback;
  }
  return parsed;
};

export default function CreateFood() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const router = useRouter();
  const params = useLocalSearchParams();

  const barcodeParam = params.barcode;
  const initialBarcode = useMemo(() => {
    if (Array.isArray(barcodeParam)) {
      return barcodeParam[0] ?? '';
    }
    if (typeof barcodeParam === 'string') {
      return barcodeParam;
    }
    return '';
  }, [barcodeParam]);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [foodGroup, setFoodGroup] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [advancedNumbers, setAdvancedNumbers] = useState<AdvancedNumberState>(
    buildEmptyAdvancedNumbers(),
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [caloriesError, setCaloriesError] = useState<string | undefined>();
  const [createdFood, setCreatedFood] = useState<Food | null>(null);
  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const updateAdvancedNumber = (key: AdvancedNumberKey, value: string) => {
    setAdvancedNumbers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const buildPayload = (): CreateFoodDto | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required.');
      return null;
    }
    const caloriesValue = parseRequiredNumber(calories);
    if (caloriesValue === null) {
      setCaloriesError('Calories are required.');
      return null;
    }

    setNameError(undefined);
    setCaloriesError(undefined);

    const proteinValue = parseOptionalNumberWithFallback(protein, 0);
    const carbsValue = parseOptionalNumberWithFallback(carbs, 0);
    const fatValue = parseOptionalNumberWithFallback(fat, 0);

    const fiberValue = parseOptionalNumberWithFallback(
      advancedNumbers.fiber,
      0,
    );
    const sugarValue = parseOptionalNumberWithFallback(
      advancedNumbers.sugar,
      0,
    );
    const sodiumValue = parseOptionalNumberWithFallback(
      advancedNumbers.sodium,
      0,
    );

    const payload: CreateFoodDto = {
      name: trimmedName,
      calories: caloriesValue,
      protein: proteinValue,
      carbs: carbsValue,
      fat: fatValue,
      fiber: fiberValue,
      sugar: sugarValue,
      sodium: sodiumValue,
    };

    const trimmedBrand = brand.trim();
    if (trimmedBrand) {
      payload.brand = trimmedBrand;
    }
    const trimmedGroup = foodGroup.trim();
    if (trimmedGroup) {
      payload.foodGroup = trimmedGroup;
    }

    const saturatedFat = parseOptionalNumber(advancedNumbers.saturatedFat);
    if (saturatedFat !== undefined) payload.saturatedFat = saturatedFat;
    const transFat = parseOptionalNumber(advancedNumbers.transFat);
    if (transFat !== undefined) payload.transFat = transFat;
    const cholesterol = parseOptionalNumber(advancedNumbers.cholesterol);
    if (cholesterol !== undefined) payload.cholesterol = cholesterol;
    const addedSugar = parseOptionalNumber(advancedNumbers.addedSugar);
    if (addedSugar !== undefined) payload.addedSugar = addedSugar;
    const netCarbs = parseOptionalNumber(advancedNumbers.netCarbs);
    if (netCarbs !== undefined) payload.netCarbs = netCarbs;
    const solubleFiber = parseOptionalNumber(advancedNumbers.solubleFiber);
    if (solubleFiber !== undefined) payload.solubleFiber = solubleFiber;
    const insolubleFiber = parseOptionalNumber(advancedNumbers.insolubleFiber);
    if (insolubleFiber !== undefined) payload.insolubleFiber = insolubleFiber;
    const water = parseOptionalNumber(advancedNumbers.water);
    if (water !== undefined) payload.water = water;
    const pralScore = parseOptionalNumber(advancedNumbers.pralScore);
    if (pralScore !== undefined) payload.pralScore = pralScore;
    const omega3 = parseOptionalNumber(advancedNumbers.omega3);
    if (omega3 !== undefined) payload.omega3 = omega3;
    const omega6 = parseOptionalNumber(advancedNumbers.omega6);
    if (omega6 !== undefined) payload.omega6 = omega6;
    const calcium = parseOptionalNumber(advancedNumbers.calcium);
    if (calcium !== undefined) payload.calcium = calcium;
    const iron = parseOptionalNumber(advancedNumbers.iron);
    if (iron !== undefined) payload.iron = iron;
    const potassium = parseOptionalNumber(advancedNumbers.potassium);
    if (potassium !== undefined) payload.potassium = potassium;
    const magnesium = parseOptionalNumber(advancedNumbers.magnesium);
    if (magnesium !== undefined) payload.magnesium = magnesium;
    const vitaminAiu = parseOptionalNumber(advancedNumbers.vitaminAiu);
    if (vitaminAiu !== undefined) payload.vitaminAiu = vitaminAiu;
    const vitaminArae = parseOptionalNumber(advancedNumbers.vitaminArae);
    if (vitaminArae !== undefined) payload.vitaminArae = vitaminArae;
    const vitaminC = parseOptionalNumber(advancedNumbers.vitaminC);
    if (vitaminC !== undefined) payload.vitaminC = vitaminC;
    const vitaminB12 = parseOptionalNumber(advancedNumbers.vitaminB12);
    if (vitaminB12 !== undefined) payload.vitaminB12 = vitaminB12;
    const vitaminD = parseOptionalNumber(advancedNumbers.vitaminD);
    if (vitaminD !== undefined) payload.vitaminD = vitaminD;
    const vitaminE = parseOptionalNumber(advancedNumbers.vitaminE);
    if (vitaminE !== undefined) payload.vitaminE = vitaminE;
    const phosphorus = parseOptionalNumber(advancedNumbers.phosphorus);
    if (phosphorus !== undefined) payload.phosphorus = phosphorus;
    const zinc = parseOptionalNumber(advancedNumbers.zinc);
    if (zinc !== undefined) payload.zinc = zinc;
    const copper = parseOptionalNumber(advancedNumbers.copper);
    if (copper !== undefined) payload.copper = copper;
    const manganese = parseOptionalNumber(advancedNumbers.manganese);
    if (manganese !== undefined) payload.manganese = manganese;
    const selenium = parseOptionalNumber(advancedNumbers.selenium);
    if (selenium !== undefined) payload.selenium = selenium;
    const fluoride = parseOptionalNumber(advancedNumbers.fluoride);
    if (fluoride !== undefined) payload.fluoride = fluoride;
    const molybdenum = parseOptionalNumber(advancedNumbers.molybdenum);
    if (molybdenum !== undefined) payload.molybdenum = molybdenum;
    const chlorine = parseOptionalNumber(advancedNumbers.chlorine);
    if (chlorine !== undefined) payload.chlorine = chlorine;
    const vitaminB1 = parseOptionalNumber(advancedNumbers.vitaminB1);
    if (vitaminB1 !== undefined) payload.vitaminB1 = vitaminB1;
    const vitaminB2 = parseOptionalNumber(advancedNumbers.vitaminB2);
    if (vitaminB2 !== undefined) payload.vitaminB2 = vitaminB2;
    const vitaminB3 = parseOptionalNumber(advancedNumbers.vitaminB3);
    if (vitaminB3 !== undefined) payload.vitaminB3 = vitaminB3;
    const vitaminB5 = parseOptionalNumber(advancedNumbers.vitaminB5);
    if (vitaminB5 !== undefined) payload.vitaminB5 = vitaminB5;
    const vitaminB6 = parseOptionalNumber(advancedNumbers.vitaminB6);
    if (vitaminB6 !== undefined) payload.vitaminB6 = vitaminB6;
    const biotin = parseOptionalNumber(advancedNumbers.biotin);
    if (biotin !== undefined) payload.biotin = biotin;
    const folate = parseOptionalNumber(advancedNumbers.folate);
    if (folate !== undefined) payload.folate = folate;
    const folicAcid = parseOptionalNumber(advancedNumbers.folicAcid);
    if (folicAcid !== undefined) payload.folicAcid = folicAcid;
    const foodFolate = parseOptionalNumber(advancedNumbers.foodFolate);
    if (foodFolate !== undefined) payload.foodFolate = foodFolate;
    const folateDfe = parseOptionalNumber(advancedNumbers.folateDfe);
    if (folateDfe !== undefined) payload.folateDfe = folateDfe;
    const choline = parseOptionalNumber(advancedNumbers.choline);
    if (choline !== undefined) payload.choline = choline;
    const betaine = parseOptionalNumber(advancedNumbers.betaine);
    if (betaine !== undefined) payload.betaine = betaine;
    const retinol = parseOptionalNumber(advancedNumbers.retinol);
    if (retinol !== undefined) payload.retinol = retinol;
    const caroteneBeta = parseOptionalNumber(advancedNumbers.caroteneBeta);
    if (caroteneBeta !== undefined) payload.caroteneBeta = caroteneBeta;
    const caroteneAlpha = parseOptionalNumber(advancedNumbers.caroteneAlpha);
    if (caroteneAlpha !== undefined) payload.caroteneAlpha = caroteneAlpha;
    const lycopene = parseOptionalNumber(advancedNumbers.lycopene);
    if (lycopene !== undefined) payload.lycopene = lycopene;
    const luteinZeaxanthin = parseOptionalNumber(
      advancedNumbers.luteinZeaxanthin,
    );
    if (luteinZeaxanthin !== undefined)
      payload.luteinZeaxanthin = luteinZeaxanthin;
    const vitaminD2 = parseOptionalNumber(advancedNumbers.vitaminD2);
    if (vitaminD2 !== undefined) payload.vitaminD2 = vitaminD2;
    const vitaminD3 = parseOptionalNumber(advancedNumbers.vitaminD3);
    if (vitaminD3 !== undefined) payload.vitaminD3 = vitaminD3;
    const vitaminDiu = parseOptionalNumber(advancedNumbers.vitaminDiu);
    if (vitaminDiu !== undefined) payload.vitaminDiu = vitaminDiu;
    const vitaminK = parseOptionalNumber(advancedNumbers.vitaminK);
    if (vitaminK !== undefined) payload.vitaminK = vitaminK;
    const dihydrophylloquinone = parseOptionalNumber(
      advancedNumbers.dihydrophylloquinone,
    );
    if (dihydrophylloquinone !== undefined)
      payload.dihydrophylloquinone = dihydrophylloquinone;
    const menaquinone4 = parseOptionalNumber(advancedNumbers.menaquinone4);
    if (menaquinone4 !== undefined) payload.menaquinone4 = menaquinone4;
    const monoFat = parseOptionalNumber(advancedNumbers.monoFat);
    if (monoFat !== undefined) payload.monoFat = monoFat;
    const polyFat = parseOptionalNumber(advancedNumbers.polyFat);
    if (polyFat !== undefined) payload.polyFat = polyFat;
    const ala = parseOptionalNumber(advancedNumbers.ala);
    if (ala !== undefined) payload.ala = ala;
    const epa = parseOptionalNumber(advancedNumbers.epa);
    if (epa !== undefined) payload.epa = epa;
    const dpa = parseOptionalNumber(advancedNumbers.dpa);
    if (dpa !== undefined) payload.dpa = dpa;
    const dha = parseOptionalNumber(advancedNumbers.dha);
    if (dha !== undefined) payload.dha = dha;

    return payload;
  };

  const handleSave = async (shouldLog: boolean) => {
    if (isSaving) {
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      return;
    }
    setIsSaving(true);
    try {
      const created = await createFood(payload);
      setCreatedFood(created);

      const trimmedBarcode = barcode.trim();
      if (trimmedBarcode) {
        try {
          await createBarcodeMapping({
            barcode: trimmedBarcode,
            food: payload,
          });
        } catch (error) {
          Alert.alert(
            'Barcode not linked',
            'We saved the food, but failed to link the barcode.',
          );
        }
      }

      if (shouldLog) {
        setIsEntryModalVisible(true);
        return;
      }

      Alert.alert('Saved', 'Food added to the database.');
      router.replace('/logfood');
    } catch (error) {
      if (isAxiosError(error)) {
        Alert.alert('Error', 'Failed to save the food.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePress = () => {
    Alert.alert('Save food', 'What would you like to do?', [
      {
        text: 'Save only',
        onPress: () => handleSave(false),
      },
      {
        text: 'Save and log',
        onPress: () => handleSave(true),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleEntrySubmit = async ({
    servings,
    mealType,
    measurementId,
    loggedAt,
  }: {
    servings: number;
    mealType: MealType;
    measurementId?: number;
    loggedAt?: Date;
  }) => {
    if (!createdFood) {
      return;
    }
    setIsLogging(true);
    try {
      await createFoodEntry({
        servings,
        mealType,
        foodId: createdFood.id,
        measurementId,
        loggedAt: loggedAt,
      });
      setIsEntryModalVisible(false);
      router.replace('/diary');
    } catch (error) {
      Alert.alert('Error', 'Failed to log the food.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleEntryDismiss = () => {
    setIsEntryModalVisible(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
      >
        <ThemedText style={styles.title}>Create a food</ThemedText>

        <DuckTextInput
          label="Name"
          value={name}
          onChangeText={setName}
          required
          error={nameError}
          testID="createfood-name-input"
        />
        <DuckTextInput
          label="Calories"
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          required
          error={caloriesError}
          testID="createfood-calories-input"
        />
        <DuckTextInput
          label="Protein (g)"
          value={protein}
          onChangeText={setProtein}
          keyboardType="numeric"
        />
        <DuckTextInput
          label="Carbs (g)"
          value={carbs}
          onChangeText={setCarbs}
          keyboardType="numeric"
        />
        <DuckTextInput
          label="Fat (g)"
          value={fat}
          onChangeText={setFat}
          keyboardType="numeric"
        />

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setIsAdvancedOpen((prev) => !prev)}
          >
            <ThemedText style={styles.advancedToggleText}>
              {isAdvancedOpen
                ? 'Hide nutrition details'
                : 'Add more nutrition details'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {isAdvancedOpen && (
          <View style={styles.advancedSection}>
            <DuckTextInput
              label="Brand"
              value={brand}
              onChangeText={setBrand}
            />
            <DuckTextInput
              label="Food group"
              value={foodGroup}
              onChangeText={setFoodGroup}
            />
            <DuckTextInput
              label="Barcode"
              value={barcode}
              onChangeText={setBarcode}
              editable={!initialBarcode}
              helperText={
                initialBarcode
                  ? 'This barcode will be linked to the food.'
                  : undefined
              }
            />
            {advancedFieldList.map((field) => (
              <DuckTextInput
                key={field.key}
                label={field.label}
                value={advancedNumbers[field.key]}
                onChangeText={(value) => updateAdvancedNumber(field.key, value)}
                keyboardType="numeric"
                helperText={field.helper}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.tint, opacity: isSaving ? 0.7 : 1 },
          ]}
          onPress={handleSavePress}
          disabled={isSaving}
          testID="createfood-save-button"
        >
          <ThemedText style={styles.saveButtonText}>Save</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      <FoodEntryModal
        visible={isEntryModalVisible}
        onDismiss={handleEntryDismiss}
        onSubmit={handleEntrySubmit}
        food={createdFood ?? undefined}
        colors={colors}
        submitLabel="Log food"
        isSubmitting={isLogging}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginTop: 8,
  },
  advancedToggle: {
    paddingVertical: 8,
  },
  advancedToggleText: {
    fontWeight: '600',
  },
  advancedSection: {
    gap: 8,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
