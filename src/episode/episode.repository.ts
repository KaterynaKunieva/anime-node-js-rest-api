import { EpisodeCreateDto } from './dto/EpisodeCreateDto';
import { GetEpisodesInAnimeDto } from './dto/GetEpisodesInAnimeDto';
import Episode, { EpisodeData } from './episode.model';

/**
 * Creates a new episode in the database.
 * @param episodeData - The data to create the episode.
 * @returns The created episode document.
 */
export const create = async (
  episodeData: EpisodeCreateDto,
): Promise<EpisodeData> => {
  return await Episode.create(episodeData);
};

/**
 * Retrieves a paginated list of episodes for a specific anime.
 * @param query - Filter, pagination, and sorting parameters.
 * @returns Array of episode documents.
 */
export const getEpisodesInAnime = async (
  query: GetEpisodesInAnimeDto,
): Promise<EpisodeData[]> => {
  const episodes = await Episode.find({ animeId: query.animeId })
    .sort({ releaseDate: -1, orderToWatch: -1 })
    .limit(query.size)
    .skip(query.from)
    .lean()
    .exec();
  return episodes;
};

/**
 * Counts how many episodes exist for each provided anime ID.
 * @param animeIds - Array of anime IDs.
 * @returns Map of animeId to episode count.
 */
export const countEpisodes = async (
  animeIds: string[],
): Promise<Record<string, number>> => {
  const countedEpisodes = await Episode.aggregate([
    { $match: { animeId: { $in: animeIds } } },
    { $group: { _id: '$animeId', counter: { $sum: 1 } } },
  ]).exec();

  const results = new Map(countedEpisodes.map((i) => [i._id, i.counter]));

  return animeIds.reduce(
    (acc, id) => {
      acc[id] = results.get(id) || 0;
      return acc;
    },
    {} as Record<string, number>,
  );
};
