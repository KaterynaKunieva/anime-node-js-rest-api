import axios from 'axios';
import * as animeService from '../anime-integration.service';
import { ANIME_DB } from '../mocked/anime.data';
import { randomUUID } from 'node:crypto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Anime Integration Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Should return data from API when request is successful', async () => {
    const animeId = randomUUID();
    const mockData = { id: animeId, title: 'Naruto' };
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const result = await animeService.get(animeId);

    expect(result?.id).toBe(animeId);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('Should return null if API returns 404', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    const result = await animeService.get(randomUUID());

    expect(result).toBeNull();
  });

  test('Should use ANIME_DB as fallback if API returns 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Internal Server Error'));

    const mockFromDb = { title: 'Moked Anime' };
    const animeId = randomUUID();

    ANIME_DB[animeId] = mockFromDb as any;

    const result = await animeService.get(animeId);

    expect(result).toMatchObject(mockFromDb);
  });
});
