import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import * as episodeService from '../episode.service';
import * as episodeRepository from '../episode.repository';
import * as animeService from '../anime-integration.service';
import { AnimeInfoDto } from '../dto/AnimeInfoDto';
import { EpisodeCreateDto } from '../dto/EpisodeCreateDto';
import Episode, { EpisodeData } from '../episode.model';
import { ValidationException } from '../../exceptions/ValidationExceptions';
import {
  EPISODE_CONFIG,
  EPISODE_VALIDATION_MESSAGES,
} from '../episode.constants';
import { DuplicateException } from '../../exceptions/DuplicateExceptions';
import { GetEpisodesInAnimeDto } from '../dto/GetEpisodesInAnimeDto';
import { EpisodeInfoDto } from '../dto/EpisodeInfoDto';

describe('Episode Service', () => {
  const getValidEpisode = (): EpisodeCreateDto => ({
    title: 'Valid Episode Title',
    orderToWatch: 1,
    releaseDate: new Date(),
    animeId: randomUUID(),
  });

  const mockAnime = (id: string): AnimeInfoDto => ({
    id,
    title: 'Test Anime',
    releaseYear: 2010,
    score: 10,
    author: 'Author',
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    test('Should create an episode successfully', async () => {
      const dto = getValidEpisode();
      const episodeId = new mongoose.Types.ObjectId();

      jest
        .spyOn(animeService, 'get')
        .mockResolvedValueOnce(mockAnime(dto.animeId));

      const dbRecord = new Episode({
        _id: episodeId,
        ...dto,
      }) as EpisodeData;
      jest.spyOn(episodeRepository, 'create').mockResolvedValueOnce(dbRecord);

      const result = await episodeService.create(dto);

      expect(result).not.toHaveProperty('_id');
      expect(result.id).toBe(episodeId.toString());
      expect(result.title).toBe(dto.title);
      expect(result.orderToWatch).toBe(dto.orderToWatch);
      expect(new Date(result.releaseDate).toISOString()).toBe(
        dto.releaseDate.toISOString(),
      );
      expect(result.animeId).toBe(dto.animeId);
      expect(episodeRepository.create).toHaveBeenCalledWith(dto);
    });

    test('Should create an episode without optional fields', async () => {
      const { title: _title, ...dto } = getValidEpisode();

      jest
        .spyOn(animeService, 'get')
        .mockResolvedValueOnce(mockAnime(dto.animeId));

      const dbRecord = new Episode({
        _id: new mongoose.Types.ObjectId(),
        ...dto,
      }) as EpisodeData;
      jest.spyOn(episodeRepository, 'create').mockResolvedValueOnce(dbRecord);

      const result = await episodeService.create(dto);

      expect(result.title).toBeUndefined();
      expect(episodeRepository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ title: expect.any(String) }),
      );
    });

    test('Should throw Error if repository.create fails with a generic error', async () => {
      const dto = getValidEpisode();
      const repoError = new Error('Repository error');

      jest
        .spyOn(animeService, 'get')
        .mockResolvedValueOnce(mockAnime(dto.animeId));

      jest.spyOn(episodeRepository, 'create').mockRejectedValueOnce(repoError);

      await expect(episodeService.create(dto)).rejects.toThrow(
        'Repository error',
      );
    });

    test('Should throw DuplicateException if repository fails with code 11000', async () => {
      const dto = getValidEpisode();

      const mongoDuplicateError = {
        code: 11000,
        keyValue: {
          animeId: dto.animeId,
          orderToWatch: dto.orderToWatch,
        },
      };

      jest
        .spyOn(animeService, 'get')
        .mockResolvedValueOnce(mockAnime(dto.animeId));

      jest
        .spyOn(episodeRepository, 'create')
        .mockRejectedValueOnce(mongoDuplicateError);

      await expect(episodeService.create(dto)).rejects.toThrow(
        DuplicateException,
      );
    });

    test('Should throw 400 (Validation). releaseDate must be after the start of whole anime', async () => {
      const anime = mockAnime(randomUUID());
      const invalidDate = new Date(anime.releaseYear - 1, 0, 1);

      const dto = {
        ...getValidEpisode(),
        animeId: anime.id,
        releaseDate: invalidDate,
      };

      jest.spyOn(animeService, 'get').mockResolvedValueOnce(anime);

      await expect(episodeService.create(dto)).rejects.toThrow(
        ValidationException,
      );
    });

    test(
      'Should throw 400 (Validation). releaseDate must be not after then ' +
        EPISODE_CONFIG.MAX_FUTURE_RELEASE_YEARS +
        ' years in future',
      async () => {
        const dateInFuture = new Date();
        const maxReleaseYear =
          dateInFuture.getFullYear() + EPISODE_CONFIG.MAX_FUTURE_RELEASE_YEARS;
        dateInFuture.setFullYear(maxReleaseYear + 1, 0, 1);

        const dto = {
          ...getValidEpisode(),
          releaseDate: dateInFuture,
        };

        jest
          .spyOn(animeService, 'get')
          .mockResolvedValueOnce(mockAnime(dto.animeId));

        await expect(episodeService.create(dto)).rejects.toThrow(
          ValidationException,
        );
      },
    );

    test('Should throw 400 (Validation). animeId must be present in Anime database', async () => {
      const dto = getValidEpisode();
      jest.spyOn(animeService, 'get').mockResolvedValueOnce(null);
      await expect(episodeService.create(dto)).rejects.toThrow(
        ValidationException,
      );
    });

    test('Should throw 409 (Duplicate). orderToWatch must be unique in anime', async () => {
      const dto = getValidEpisode();

      const mongoError = {
        code: 11000,
        keyValue: {
          animeId: dto.animeId,
          orderToWatch: dto.orderToWatch,
        },
      };

      jest
        .spyOn(animeService, 'get')
        .mockResolvedValueOnce(mockAnime(dto.animeId));
      jest.spyOn(episodeRepository, 'create').mockRejectedValueOnce(mongoError);

      await expect(episodeService.create(dto)).rejects.toThrow(
        DuplicateException,
      );
    });
  });

  describe('getEpisodesInAnime', () => {
    test('Should return an empty list', async () => {
      const anime = mockAnime(randomUUID());
      const query = {
        animeId: anime.id,
        from: 0,
        size: 10,
      } as GetEpisodesInAnimeDto;

      jest.spyOn(animeService, 'get').mockResolvedValueOnce(anime);
      jest
        .spyOn(episodeRepository, 'getEpisodesInAnime')
        .mockResolvedValueOnce([]);
      const result = await episodeService.getEpisodesInAnime(query);
      expect(result).toHaveLength(0);
    });

    test('Should return list with default parameters', async () => {
      const anime = mockAnime(randomUUID());
      const query = {
        animeId: anime.id,
      } as GetEpisodesInAnimeDto;
      const mockDbEpisodes = Array.from({ length: 3 }, (_, index) => ({
        ...getValidEpisode(),
        _id: new mongoose.Types.ObjectId(),
        orderToWatch: index + 1,
        animeId: anime.id,
      }));
      jest.spyOn(animeService, 'get').mockResolvedValueOnce(anime);
      jest
        .spyOn(episodeRepository, 'getEpisodesInAnime')
        .mockResolvedValueOnce(mockDbEpisodes as any);
      const result = await episodeService.getEpisodesInAnime(query);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(EpisodeInfoDto);
      expect(result[0].title).toBe(mockDbEpisodes[0].title);
      expect(result[0].orderToWatch).toBe(mockDbEpisodes[0].orderToWatch);
      expect(result[0].id).toBe(mockDbEpisodes[0]._id.toString());
      expect(typeof result[0].releaseDate).toBe('string');
      expect(result[0]).not.toHaveProperty('_id');
      expect(episodeRepository.getEpisodesInAnime).toHaveBeenCalledWith(query);
    });

    test('Should pass pagination parameters to repository correctly', async () => {
      const anime = mockAnime(randomUUID());
      const query = {
        animeId: anime.id,
        from: 20,
        size: 50,
      };

      jest.spyOn(animeService, 'get').mockResolvedValueOnce(anime);
      jest
        .spyOn(episodeRepository, 'getEpisodesInAnime')
        .mockResolvedValueOnce([]);

      await episodeService.getEpisodesInAnime(query);

      expect(episodeRepository.getEpisodesInAnime).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 20,
          size: 50,
        }),
      );
    });

    test('Should throw 400 (Validation). animeId must be present in Anime database', async () => {
      const anime = mockAnime(randomUUID());
      const query = {
        animeId: anime.id,
      } as GetEpisodesInAnimeDto;

      jest.spyOn(animeService, 'get').mockResolvedValueOnce(null);
      await expect(episodeService.getEpisodesInAnime(query)).rejects.toThrow(
        ValidationException,
      );
    });

    test('Should handle episodes with missing optional title', async () => {
      const anime = mockAnime(randomUUID());
      const dbEpisode = {
        _id: new mongoose.Types.ObjectId(),
        orderToWatch: 5,
        releaseDate: new Date(),
        animeId: anime.id,
      };

      jest.spyOn(animeService, 'get').mockResolvedValueOnce(anime);
      jest
        .spyOn(episodeRepository, 'getEpisodesInAnime')
        .mockResolvedValueOnce([dbEpisode] as any);

      const result = await episodeService.getEpisodesInAnime({
        animeId: anime.id,
      } as GetEpisodesInAnimeDto);

      expect(result[0].title).toBeUndefined();
      expect(result[0].orderToWatch).toBe(5);
    });
  });

  describe('countEpisodes', () => {
    test('Should count episodes in anime', async () => {
      const animeIds = Array.from({ length: 4 }, () => randomUUID());
      const mockCounts = Object.fromEntries(
        animeIds.map((id, index) => [id, (index + 1) * 10]),
      );
      jest.spyOn(animeService, 'get').mockResolvedValue({} as AnimeInfoDto);
      jest
        .spyOn(episodeRepository, 'countEpisodes')
        .mockResolvedValueOnce(mockCounts);
      const result = await episodeService.countEpisodes(animeIds);
      expect(result).toEqual(mockCounts);
      expect(episodeRepository.countEpisodes).toHaveBeenCalledWith(animeIds);
    });

    test('Should throw 400 (Validation). Each animeId in the list must exist in Anime db', async () => {
      const validId = randomUUID();
      const invalidId1 = randomUUID();
      const invalidId2 = randomUUID();
      const animeIds = [validId, invalidId1, invalidId2];

      jest.spyOn(animeService, 'get').mockImplementation(async (id: string) => {
        if (id === validId) return mockAnime(id);
        return null;
      });
      await expect(episodeService.countEpisodes(animeIds)).rejects.toThrow(
        ValidationException,
      );

      await expect(episodeService.countEpisodes(animeIds)).rejects.toThrow(
        new RegExp(
          [
            EPISODE_VALIDATION_MESSAGES.ANIME_NOT_FOUND(invalidId1),
            EPISODE_VALIDATION_MESSAGES.ANIME_NOT_FOUND(invalidId2),
          ].join(', '),
        ),
      );
    });

    test('Should handle duplicate animeIds', async () => {
      const id = randomUUID();
      const animeIds = [id, id, id];

      const mockCounts = { [id]: 5 };

      jest.spyOn(animeService, 'get').mockResolvedValue({ id } as any);
      jest
        .spyOn(episodeRepository, 'countEpisodes')
        .mockResolvedValueOnce(mockCounts);

      const result = await episodeService.countEpisodes(animeIds);

      expect(result).toEqual(mockCounts);
      expect(animeService.get).toHaveBeenCalledTimes(1);
    });
  });
});
