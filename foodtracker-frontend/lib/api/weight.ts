import apiService from "@/lib/api";
import { CreateWeightDto } from "@/types/weight/createweight";
import { Weight } from "@/types/weight/weight";

export const createWeight = async (
	payload: CreateWeightDto
): Promise<Weight> => {
	const response = await apiService.post<Weight>("/weight/create", payload);
	return response.data;
};
