import { Client } from '@elastic/elasticsearch';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

type FoodSearchDocument = {
  id: number;
  name: string;
  brand?: string | null;
};

@Injectable()
export class FoodSearchService implements OnModuleInit {
  private readonly logger = new Logger(FoodSearchService.name);
  private readonly client: Client;
  private readonly indexName: string;

  constructor() {
    const node = process.env.ES_URL ?? 'http://localhost:9200';
    this.indexName = process.env.ES_FOOD_INDEX ?? 'foods';
    this.client = new Client({ node });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureIndex();
  }

  async indexFood(food: FoodSearchDocument): Promise<void> {
    await this.client.index({
      index: this.indexName,
      id: food.id.toString(),
      document: {
        name: food.name,
        brand: food.brand ?? null,
      },
      refresh: 'wait_for',
    });
  }

  async bulkIndexFoods(foods: FoodSearchDocument[]): Promise<void> {
    if (foods.length === 0) {
      return;
    }

    const operations = foods.flatMap((food) => [
      { index: { _index: this.indexName, _id: food.id.toString() } },
      {
        name: food.name,
        brand: food.brand ?? null,
      },
    ]);

    const response = await this.client.bulk({
      refresh: 'wait_for',
      operations,
    });

    if (response.errors) {
      this.logger.warn('Elasticsearch bulk indexing reported errors.');
    }
  }

  async searchFoodsByName(query: string, limit: number): Promise<number[]> {
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) {
      return [];
    }
    const normalizedQuery = sanitizedQuery.toLowerCase();

    const response = await this.client.search({
      index: this.indexName,
      size: limit,
      query: {
        bool: {
          should: [
            {
              term: {
                'name.keyword': {
                  value: normalizedQuery,
                  boost: 8,
                },
              },
            },
            {
              match_phrase: {
                name: {
                  query: sanitizedQuery,
                  boost: 4,
                },
              },
            },
            {
              term: {
                'brand.keyword': {
                  value: normalizedQuery,
                  boost: 1,
                },
              },
            },
            {
              multi_match: {
                query: sanitizedQuery,
                fields: ['name^3', 'brand^0.5'],
                fuzziness: 'AUTO',
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    });

    return response.hits.hits
      .map((hit) => hit._id)
      .filter((id): id is string => typeof id === 'string')
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isFinite(id));
  }

  private async ensureIndex(): Promise<void> {
    const existsResponse = await this.client.indices.exists({ index: this.indexName });
    const indexExists =
      typeof existsResponse === 'boolean'
        ? existsResponse
        : (existsResponse as { body: boolean }).body;

    if (indexExists) {
      return;
    }

    try {
      await this.client.indices.create({
        index: this.indexName,
        settings: {
          analysis: {
            normalizer: {
              lowercase_normalizer: {
                type: 'custom',
                filter: ['lowercase'],
              },
            },
          },
        },
        mappings: {
          properties: {
            name: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  normalizer: 'lowercase_normalizer',
                },
              },
            },
            brand: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  normalizer: 'lowercase_normalizer',
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to create Elasticsearch index.', error as Error);
      throw error;
    }
  }
}
