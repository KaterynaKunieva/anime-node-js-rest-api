import { plainToInstance } from 'class-transformer';
import { EpisodeCreateDto } from './dto/EpisodeCreateDto';
import { EpisodeInfoDto } from './dto/EpisodeInfoDto';
import { GetEpisodesInAnimeDto } from './dto/GetEpisodesInAnimeDto';
import * as episodeRepository from './episode.repository';
import * as animeService from './anime-integration.service';
import { ValidationException } from '../exceptions/ValidationExceptions';
import {
  EPISODE_CONFIG,
  EPISODE_VALIDATION_MESSAGES,
} from './episode.constants';
import { AnimeInfoDto } from './dto/AnimeInfoDto';
import { ERROR_MESSAGES } from '../common/common.constants';
import { DuplicateException } from '../exceptions/DuplicateExceptions';

/**
 * Validates and creates a new episode.
 * @param episodeData - The data object containing episode details to be created.
 * @returns A promise that resolves to the transformed episode info DTO.
 * @throws {ValidationException} If the associated anime doesn't exist or dates are out of valid range.
 * @throws {DuplicateException} If a database unique constraint is violated.
 */
export const create = async (
  episodeData: EpisodeCreateDto,
): Promise<EpisodeInfoDto> => {
  await validateEpisodeData(episodeData);
  try {
    const newEpisode = await episodeRepository.create(episodeData);
    return plainToInstance(EpisodeInfoDto, newEpisode, {
      excludeExtraneousValues: true,
    });
  } catch (err: any) {
    if (err.code === 11000 && err.keyValue) {
      const messages = Object.entries(err.keyValue).map(([key, value]) =>
        ERROR_MESSAGES.DUPLICATE(key, String(value)),
      );
      throw new DuplicateException(messages);
    }
    throw err;
  }
};

/**
 * Returns episodes for a specific anime, validating the existence of anime.
 * @param query - DTO containing the animeId and pagination parameters.
 * @returns A promise resolving to array of episode information.
 * @throws {ValidationException} If the animeId provided in the query does not exist.
 */
export const getEpisodesInAnime = async (
  query: GetEpisodesInAnimeDto,
): Promise<EpisodeInfoDto[]> => {
  await getValidatedAnime(query.animeId);
  const episodes = await episodeRepository.getEpisodesInAnime(query);
  return episodes.map((episode) =>
    plainToInstance(EpisodeInfoDto, episode, { excludeExtraneousValues: true }),
  );
};

/**
 * Validates multiple anime IDs and returns their episode counts.
 * @param animeIds - array of anime unique IDs to process.
 * @returns A promise resolving to an object mapping anime IDs to their counts.
 * @throws {ValidationException} If one or more anime IDs are invalid or not found.
 */
export const countEpisodes = async (
  animeIds: string[],
): Promise<Record<string, number>> => {
  const uniqueIds = Array.from(new Set(animeIds));
  throwValidationErrors(
    await Promise.allSettled(
      uniqueIds.map((animeId) => getValidatedAnime(animeId)),
    ),
  );

  return await episodeRepository.countEpisodes(uniqueIds);
};

/**
 * Checks if an anime exists via the integration service.
 * @private
 * @param animeId - The unique ID of the anime to validate.
 * @returns A promise resolving to the anime details if found.
 * @throws {ValidationException} If the anime is not found in the integration service.
 */
const getValidatedAnime = async (animeId: string): Promise<AnimeInfoDto> => {
  const anime = await animeService.get(animeId);
  if (!anime) {
    throw new ValidationException(
      EPISODE_VALIDATION_MESSAGES.ANIME_NOT_FOUND(animeId),
    );
  }
  return anime;
};

/**
 * Validates dates and existence of anime for episode creation.
 * @private
 * @param episodeData - The episode data to be checked for business rule compliance.
 * @returns Resolves if validation passes.
 * @throws {ValidationException} If the episode release date is before the anime start or too far in the future.
 */
const validateEpisodeData = async (
  episodeData: EpisodeCreateDto,
): Promise<void> => {
  const anime = await getValidatedAnime(episodeData.animeId);

  const episodeRelease = episodeData.releaseDate;
  const minEpisodeRelease = new Date(anime.releaseYear, 0, 1);
  const maxEpisodeRelease = new Date();
  const maxYear =
    maxEpisodeRelease.getFullYear() + EPISODE_CONFIG.MAX_FUTURE_RELEASE_YEARS;
  maxEpisodeRelease.setFullYear(maxYear);

  if (episodeRelease < minEpisodeRelease) {
    throw new ValidationException(
      EPISODE_VALIDATION_MESSAGES.RELEASE_BEFORE_ANIME(
        anime.releaseYear.toString(),
      ),
    );
  } else if (episodeRelease > maxEpisodeRelease) {
    throw new ValidationException(
      EPISODE_VALIDATION_MESSAGES.RELEASE_TOO_FUTURE(maxYear),
    );
  }
};

/**
 * Aggregates errors from settled promises and throws a single ValidationException.
 * @param results - array of results from Promise.allSettled.
 * @throws {ValidationException} A combined exception containing all collected error messages.
 */
export const throwValidationErrors = (
  results: PromiseSettledResult<unknown>[],
): void => {
  const messages = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason)
    .filter((err) => err instanceof ValidationException)
    .flatMap((err) => err.errors ?? [err.message]);

  if (messages.length > 0) {
    throw new ValidationException(messages);
  }
};
