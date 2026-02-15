import { Client } from '@elastic/elasticsearch';

import { FoodSearchService } from './food-search.service';

jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn(),
}));

describe('FoodSearchService', () => {
  const bulkMock = jest.fn();

  beforeEach(() => {
    bulkMock.mockResolvedValue({ errors: false });
    (Client as jest.Mock).mockImplementation(() => ({
      bulk: bulkMock,
      index: jest.fn(),
      search: jest.fn(),
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
});
