import { Client } from '@elastic/elasticsearch';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

type FoodSearchDocument = {
  id: number;
  name: string;
  brand?: string | null;
  isCsvFood: boolean;
};

@Injectable()
export class FoodSearchService implements OnModuleInit {
  private readonly logger = new Logger(FoodSearchService.name);
  private readonly client: Client;
  private readonly indexName: string;
  private readonly bulkBatchSize: number;

  constructor() {
    const node = process.env.ES_URL ?? 'http://localhost:9200';
    this.indexName = process.env.ES_FOOD_INDEX ?? 'foods';
    const parsedBatchSize = Number.parseInt(process.env.ES_BULK_BATCH_SIZE ?? '', 10);
    this.bulkBatchSize = Number.isFinite(parsedBatchSize) && parsedBatchSize > 0 ? parsedBatchSize : 500;
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
        isCsvFood: food.isCsvFood,
      },
      refresh: 'wait_for',
    });
  }

  async bulkIndexFoods(foods: FoodSearchDocument[]): Promise<void> {
    if (foods.length === 0) {
      return;
    }

    for (let start = 0; start < foods.length; start += this.bulkBatchSize) {
      const batch = foods.slice(start, start + this.bulkBatchSize);
      const operations = batch.flatMap((food) => [
        { index: { _index: this.indexName, _id: food.id.toString() } },
        {
          name: food.name,
          brand: food.brand ?? null,
          isCsvFood: food.isCsvFood,
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
        function_score: {
          query: {
            bool: {
              should: [
                {
                  term: {
                    'name.keyword': {
                      value: normalizedQuery,
                      boost: 10,
                    },
                  },
                },
                {
                  match: {
                    'name.prefix': {
                      query: normalizedQuery,
                      boost: 6,
                    },
                  },
                },
                {
                  match_phrase: {
                    name: {
                      query: sanitizedQuery,
                      boost: 3,
                    },
                  },
                },
                {
                  match: {
                    name: {
                      query: sanitizedQuery,
                      boost: 1.5,
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
                    fields: ['name^2', 'brand^0.5'],
                    fuzziness: 'AUTO',
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          functions: [
            {
              filter: { term: { isCsvFood: true } },
              weight: 1.25,
            },
          ],
          boost_mode: 'multiply',
          score_mode: 'multiply',
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

    await this.createIndex();
  }

  async recreateIndex(): Promise<void> {
    const existsResponse = await this.client.indices.exists({ index: this.indexName });
    const indexExists =
      typeof existsResponse === 'boolean'
        ? existsResponse
        : (existsResponse as { body: boolean }).body;

    if (indexExists) {
      await this.client.indices.delete({ index: this.indexName });
    }

    await this.createIndex();
  }

  private async createIndex(): Promise<void> {
    try {
      await this.client.indices.create({
        index: this.indexName,
        settings: {
          analysis: {
            filter: {
              edge_ngram_filter: {
                type: 'edge_ngram',
                min_gram: 1,
                max_gram: 20,
              },
            },
            normalizer: {
              lowercase_normalizer: {
                type: 'custom',
                filter: ['lowercase'],
              },
            },
            analyzer: {
              name_prefix_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'edge_ngram_filter'],
              },
              name_prefix_search: {
                type: 'custom',
                tokenizer: 'standard',
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
                prefix: {
                  type: 'text',
                  analyzer: 'name_prefix_analyzer',
                  search_analyzer: 'name_prefix_search',
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
            isCsvFood: {
              type: 'boolean',
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
