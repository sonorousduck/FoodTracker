import { Client } from '@elastic/elasticsearch';

import { FoodSearchService } from './food-search.service';

jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn(),
}));

describe('FoodSearchService', () => {
  const bulkMock = jest.fn();
  const searchMock = jest.fn();

  beforeEach(() => {
    bulkMock.mockResolvedValue({ errors: false });
    searchMock.mockResolvedValue({
      hits: {
        hits: [],
      },
    });
    (Client as jest.Mock).mockImplementation(() => ({
      bulk: bulkMock,
      index: jest.fn(),
      search: searchMock,
      indices: {
        exists: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    }));
  });

  afterEach(() => {
    delete process.env.ES_BULK_BATCH_SIZE;
    jest.clearAllMocks();
  });

  it('batches bulk indexing requests', async () => {
    process.env.ES_BULK_BATCH_SIZE = '2';
    const service = new FoodSearchService();

    await service.bulkIndexFoods([
      { id: 1, name: 'Food 1', brand: 'Brand', isCsvFood: true },
      { id: 2, name: 'Food 2', brand: null, isCsvFood: false },
      { id: 3, name: 'Food 3', brand: null, isCsvFood: true },
      { id: 4, name: 'Food 4', brand: null, isCsvFood: false },
      { id: 5, name: 'Food 5', brand: null, isCsvFood: true },
    ]);

    expect(bulkMock).toHaveBeenCalledTimes(3);
    expect(bulkMock.mock.calls[0][0].operations).toHaveLength(4);
    expect(bulkMock.mock.calls[2][0].operations).toHaveLength(2);
  });

  it('uses fuzzy-first search query payload', async () => {
    searchMock.mockResolvedValueOnce({
      hits: {
        hits: [{ _id: '10' }, { _id: '25' }],
      },
    });
    const service = new FoodSearchService();

    const ids = await service.searchFoodsByName('chiken brest', 5);

    expect(ids).toEqual([10, 25]);
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 'foods',
        size: 5,
        query: expect.objectContaining({
          function_score: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                should: expect.arrayContaining([
                  expect.objectContaining({
                    multi_match: expect.objectContaining({
                      query: 'chiken brest',
                      fields: ['name^3', 'brand^0.2'],
                      fuzziness: 'AUTO',
                    }),
                  }),
                  expect.objectContaining({
                    match: expect.objectContaining({
                      name: expect.objectContaining({
                        fuzziness: 'AUTO',
                      }),
                    }),
                  }),
                  expect.objectContaining({
                    match: expect.objectContaining({
                      brand: expect.objectContaining({
                        boost: 0.2,
                      }),
                    }),
                  }),
                ]),
              }),
            }),
            functions: expect.arrayContaining([
              expect.objectContaining({
                filter: { term: { isCsvFood: true } },
                weight: 4,
              }),
            ]),
          }),
        }),
      }),
    );
  });
});
