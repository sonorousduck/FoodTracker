/**
 * Auto-generated from backend DTOs/Entities on 2026-01-14 07:48:19
 * Do not edit manually.
 */

import { CreateFoodMeasurementDto } from "../foodmeasurement/createfoodmeasurement";

export interface CreateFoodDto {
    sourceId?: string;
    name: string;
    brand?: string;
    foodGroup?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    saturatedFat?: number;
    transFat?: number;
    cholesterol?: number;
    addedSugar?: number;
    netCarbs?: number;
    solubleFiber?: number;
    insolubleFiber?: number;
    water?: number;
    pralScore?: number;
    omega3?: number;
    omega6?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
    magnesium?: number;
    vitaminAiu?: number;
    vitaminArae?: number;
    vitaminC?: number;
    vitaminB12?: number;
    vitaminD?: number;
    vitaminE?: number;
    phosphorus?: number;
    zinc?: number;
    copper?: number;
    manganese?: number;
    selenium?: number;
    fluoride?: number;
    molybdenum?: number;
    chlorine?: number;
    vitaminB1?: number;
    vitaminB2?: number;
    vitaminB3?: number;
    vitaminB5?: number;
    vitaminB6?: number;
    biotin?: number;
    folate?: number;
    folicAcid?: number;
    foodFolate?: number;
    folateDfe?: number;
    choline?: number;
    betaine?: number;
    retinol?: number;
    caroteneBeta?: number;
    caroteneAlpha?: number;
    lycopene?: number;
    luteinZeaxanthin?: number;
    vitaminD2?: number;
    vitaminD3?: number;
    vitaminDiu?: number;
    vitaminK?: number;
    dihydrophylloquinone?: number;
    menaquinone4?: number;
    monoFat?: number;
    polyFat?: number;
    ala?: number;
    epa?: number;
    dpa?: number;
    dha?: number;
    measurements?: CreateFoodMeasurementDto[];
}
