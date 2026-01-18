const searchMock = jest.fn();
const indicesExistsMock = jest.fn();
const indicesCreateMock = jest.fn();

jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => ({
    search: searchMock,
    indices: {
      exists: indicesExistsMock,
      create: indicesCreateMock,
    },
  })),
}));

import { FoodSearchService } from './food-search.service';

describe('FoodSearchService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('boosts exact name matches ahead of fuzzy results', async () => {
    searchMock.mockResolvedValueOnce({
      hits: {
        hits: [{ _id: '2' }, { _id: '1' }],
      },
    });

    const service = new FoodSearchService();

    await service.searchFoodsByName('Apple', 5);

    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 'foods',
        size: 5,
        query: {
          bool: expect.objectContaining({
            minimum_should_match: 1,
            should: expect.arrayContaining([
              {
                term: {
                  'name.keyword': {
                    value: 'apple',
                    boost: 8,
                  },
                },
              },
              {
                match_phrase: {
                  name: {
                    query: 'Apple',
                    boost: 4,
                  },
                },
              },
            ]),
          }),
        },
      }),
    );
  });

  it('returns numeric ids in search order', async () => {
    searchMock.mockResolvedValueOnce({
      hits: {
        hits: [{ _id: '5' }, { _id: '2' }],
      },
    });

    const service = new FoodSearchService();

    const result = await service.searchFoodsByName('Apple', 10);

    expect(result).toEqual([5, 2]);
  });
});
