import Episode from '../episode.model';
import {
  startMongoContainer,
  stopMongoContainer,
  clearDatabase,
} from './../../tests/mongo.setup';
import * as episodeRepository from '../episode.repository';
import { randomUUID } from 'node:crypto';
import { EpisodeCreateDto } from '../dto/EpisodeCreateDto';
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { GetEpisodesInAnimeDto } from '../dto/GetEpisodesInAnimeDto';

describe('Episode Repository', () => {
  beforeAll(async () => {
    await startMongoContainer();
    await Episode.init();
  });

  afterAll(async () => {
    await stopMongoContainer();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  const getValidEpisode = (): EpisodeCreateDto => ({
    title: 'Valid Episode Title',
    orderToWatch: 0,
    releaseDate: new Date(),
    animeId: randomUUID(),
  });

  describe('create', () => {
    test('Should create an episode with optional fields', async () => {
      const episodeToCreate = {
        ...getValidEpisode(),
        title: '   Needs to trim   ',
      };
      const createdEpisode = await episodeRepository.create(episodeToCreate);
      expect(createdEpisode).toBeDefined();
      expect(createdEpisode.title).toBe('Needs to trim');
      expect(createdEpisode.orderToWatch).toBe(episodeToCreate.orderToWatch);
      expect(createdEpisode.releaseDate).toBe(episodeToCreate.releaseDate);
      expect(createdEpisode.animeId).toBe(episodeToCreate.animeId);
    });

    test('Should create an episode without optional fields', async () => {
      const { title: _title, ...episodeToCreate } = getValidEpisode();
      const createdEpisode = await episodeRepository.create(episodeToCreate);
      expect(createdEpisode).toBeDefined();
      expect(createdEpisode.title).toBeUndefined();
      expect(createdEpisode.orderToWatch).toBe(episodeToCreate.orderToWatch);
      expect(createdEpisode.releaseDate).toBe(episodeToCreate.releaseDate);
      expect(createdEpisode.animeId).toBe(episodeToCreate.animeId);
    });

    test('Should validate fields', async () => {
      const episodeToCreate = {
        ...getValidEpisode(),
        orderToWatch: -1,
      };

      await expect(episodeRepository.create(episodeToCreate)).rejects.toThrow(
        mongoose.Error.ValidationError,
      );
    });

    test('Should validate indexes', async () => {
      const validEpisode = getValidEpisode();
      const valid = await episodeRepository.create(validEpisode);
      expect(valid).toBeDefined(); // 1st must be created
      await expect(
        episodeRepository.create({
          ...getValidEpisode(),
          orderToWatch: validEpisode.orderToWatch,
          animeId: validEpisode.animeId,
        }),
      ).rejects.toThrow(MongoServerError);
    });

    test('Should validate required fields', async () => {
      await expect(
        episodeRepository.create({} as EpisodeCreateDto),
      ).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('getEpisodesInAnime', () => {
    test('Should return an empty list', async () => {
      const result = await episodeRepository.getEpisodesInAnime({
        animeId: randomUUID(),
      } as GetEpisodesInAnimeDto);
      expect(result).toEqual([]);
    });

    test('Should correctly apply pagination and descending date sorting', async () => {
      const query = {
        animeId: randomUUID(),
        size: 2,
        from: 0,
      } as GetEpisodesInAnimeDto;

      const baseDate = new Date('2026-01-01');

      const episodesToInsert = Array.from({ length: 6 }).map((_, index) => {
        const releaseDate = new Date(baseDate);
        releaseDate.setDate(baseDate.getDate() + index);

        return {
          ...getValidEpisode(),
          animeId: query.animeId,
          orderToWatch: index + 1,
          releaseDate: releaseDate,
        };
      });
      const savedEpisodes = await Episode.insertMany(episodesToInsert);

      const result = await episodeRepository.getEpisodesInAnime(query);

      expect(result).toHaveLength(2);

      expect(result[0]).toMatchObject({
        orderToWatch: 6,
        animeId: query.animeId,
        releaseDate: savedEpisodes[5].releaseDate,
      });

      expect(result[1]).toMatchObject({
        orderToWatch: 5,
        animeId: query.animeId,
        releaseDate: savedEpisodes[4].releaseDate,
      });
    });
  });

  describe('countEpisodes', () => {
    test('Should correctly aggregate and count episodes for multiple anime', async () => {
      const animeId1 = randomUUID();
      const animeId2 = randomUUID();
      const animeIdWithZero = randomUUID();
      const animeIds = [animeId1, animeId2, animeIdWithZero];

      await Episode.insertMany([
        {
          title: 'Ep 1',
          orderToWatch: 1,
          releaseDate: new Date(),
          animeId: animeId1,
        },
        {
          title: 'Ep 2',
          orderToWatch: 2,
          releaseDate: new Date(),
          animeId: animeId1,
        },
        {
          title: 'Ep 1',
          orderToWatch: 1,
          releaseDate: new Date(),
          animeId: animeId2,
        },
      ]);

      const result = await episodeRepository.countEpisodes(animeIds);

      expect(result).toEqual({
        [animeId1]: 2,
        [animeId2]: 1,
        [animeIdWithZero]: 0,
      });
      expect(Object.keys(result)).toHaveLength(3);
    });

    test('Should return 0 for all IDs if database is empty', async () => {
      const animeIds = [randomUUID(), randomUUID()];

      const result = await episodeRepository.countEpisodes(animeIds);

      expect(result).toEqual({
        [animeIds[0]]: 0,
        [animeIds[1]]: 0,
      });
    });
  });
});
