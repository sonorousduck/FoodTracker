import { apiMethods } from '@/lib/api';
import { CreateFoodDto } from '@/types/food/createfood';
import { Food } from '@/types/food/food';

export const getFoodByBarcode = async (
  barcode: string,
): Promise<Food | null> => {
  const trimmed = barcode.trim();
  if (!trimmed) {
    return null;
  }

  return apiMethods.get<Food | null>(`/food-barcodes/${trimmed}`);
};

export type BarcodeUpsertSummary = {
  createdFoods: number;
  matchedFoods: number;
  barcodesCreated: number;
  barcodesUpdated: number;
  errors: Array<{ barcode: string; reason: string }>;
};

export const createBarcodeMapping = async ({
  barcode,
  food,
}: {
  barcode: string;
  food: CreateFoodDto;
}): Promise<BarcodeUpsertSummary> => {
  return apiMethods.post<BarcodeUpsertSummary>('/food-barcodes/bulk', [
    { barcode, food },
  ]);
};
