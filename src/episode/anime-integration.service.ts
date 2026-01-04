import axios from 'axios';
import { ANIME_DB } from './mocked/anime.data';
import { useEnv } from '../config/useEnv';
import log4js from 'log4js';
import { AnimeInfoDto } from './dto/AnimeInfoDto';
import { plainToInstance } from 'class-transformer';
import { REQUEST_CONFIG } from './episode.constants';

const { ANIME_API_URL } = useEnv();

/**
 * Fetches anime info from Anime API (external), falling back to mocks on failure.
 * @param id - The Anime ID.
 * @returns The anime data or null, if not found.
 */
export const get = async (id: string): Promise<AnimeInfoDto | null> => {
  try {
    const response = await axios.get(`${ANIME_API_URL}/${id}`, {
      timeout: REQUEST_CONFIG.TIMEOUT,
    });
    return plainToInstance(AnimeInfoDto, response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      return null;
    }
    log4js.getLogger().warn(`Use mocks for anime entities`);
    return ANIME_DB[id] || null;
  }
};
