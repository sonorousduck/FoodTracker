import apiService from "@/lib/api";
import { Weight } from "@/types/weight/weight";

export const getWeights = async ({
	limit,
	since,
}: {
	limit?: number;
	since?: Date;
}): Promise<ReadonlyArray<Weight>> => {
	const params: { limit?: number; since?: string } = {};
	if (limit != null) {
		params.limit = limit;
	}

	if (since) {
		params.since = since.toISOString();
	}

	const response = await apiService.get<ReadonlyArray<Weight>>("/weight", {
		params,
	});
	return response.data;
};
