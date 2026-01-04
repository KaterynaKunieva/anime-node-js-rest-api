import mongoose from 'mongoose';
import request from 'supertest';
import { randomUUID } from 'crypto';
import * as episodeService from '../episode.service';
import * as animeService from '../anime-integration.service';
import app from '../../app';
import {
  EPISODE_VALIDATION_MESSAGES,
  EPISODE_CONFIG,
} from '../episode.constants';
import { EpisodeCreateDto } from '../dto/EpisodeCreateDto';
import { AnimeInfoDto } from '../dto/AnimeInfoDto';
import { ERROR_MESSAGES } from '../../common/common.constants';
import { plainToInstance } from 'class-transformer';
import { EpisodeInfoDto } from '../dto/EpisodeInfoDto';
import { DuplicateException } from './../../exceptions/DuplicateExceptions';

describe('Episode Controller', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
  });

  const mockAnime = (id: string): AnimeInfoDto =>
    ({
      id,
      title: 'Test Anime',
      score: 10,
      releaseYear: 2010,
      author: 'Test Author',
    }) as AnimeInfoDto;

  describe('POST /api/episode', () => {
    // create episode
    type EpisodeRequestBody = Omit<EpisodeCreateDto, 'releaseDate'> & {
      releaseDate: string;
    };

    const getValidEpisodeBody = (): EpisodeRequestBody => ({
      title: 'Valid Episode Title',
      orderToWatch: 1,
      releaseDate: new Date().toISOString(),
      animeId: randomUUID(),
    });

    test('Should create an episode with optional fields', async () => {
      const mockId = new mongoose.Types.ObjectId().toString();
      const body = getValidEpisodeBody();
      const bodyWithId = {
        ...body,
        id: mockId,
      };
      jest.spyOn(episodeService, 'create').mockResolvedValueOnce(bodyWithId);
      const response = await request(app).post('/api/episode').send(body);
      expect(response.status).toBe(201);
      expect(response.body).toEqual(bodyWithId);
      expect(episodeService.create).toHaveBeenCalledWith(
        plainToInstance(EpisodeCreateDto, body),
      );
    });

    test('Should create an episode without optional fields', async () => {
      const mockId = new mongoose.Types.ObjectId().toString();
      const { title: _title, ...body } = getValidEpisodeBody();
      const bodyWithId = {
        ...body,
        id: mockId,
      };
      jest.spyOn(episodeService, 'create').mockResolvedValueOnce(bodyWithId);
      const response = await request(app).post('/api/episode').send(body);
      expect(response.status).toBe(201);
      expect(response.body).not.toHaveProperty('title');
      expect(episodeService.create).toHaveBeenCalledWith(
        plainToInstance(EpisodeCreateDto, body),
      );
    });

    test('Should handle error when episodeService.create fails', async () => {
      const body = getValidEpisodeBody();
      const serviceError = new Error('Service error');

      jest.spyOn(episodeService, 'create').mockRejectedValueOnce(serviceError);

      const response = await request(app).post('/api/episode').send(body);

      expect(response.status).toBe(500);

      expect(episodeService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          animeId: body.animeId,
        }),
      );
    });

    test(
      'Should throw 400 (Validation). orderToWatch must not be less than ' +
        EPISODE_CONFIG.MIN_ORDER_TO_WATCH_NUMBER,
      async () => {
        const body = {
          ...getValidEpisodeBody(),
          orderToWatch: -1,
        };
        const response = await request(app).post('/api/episode').send(body);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          errors: [
            'orderToWatch must not be less than ' +
              EPISODE_CONFIG.MIN_ORDER_TO_WATCH_NUMBER,
          ],
        });
      },
    );

    test('Should throw 400 (Validation). releaseDate must be after the start of whole anime', async () => {
      const anime = mockAnime(randomUUID());
      const invalidDate = new Date(anime.releaseYear - 1, 0, 1);

      const body = {
        ...getValidEpisodeBody(),
        animeId: anime.id,
        releaseDate: invalidDate.toISOString(),
      };

      jest.spyOn(animeService, 'get').mockResolvedValueOnce(anime);

      const response = await request(app).post('/api/episode').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: [
          EPISODE_VALIDATION_MESSAGES.RELEASE_BEFORE_ANIME(
            anime.releaseYear.toString(),
          ),
        ],
      });
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

        const body = {
          ...getValidEpisodeBody(),
          releaseDate: dateInFuture.toISOString(),
        };

        jest
          .spyOn(animeService, 'get')
          .mockResolvedValueOnce(mockAnime(body.animeId));
        const response = await request(app).post('/api/episode').send(body);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          errors: [
            EPISODE_VALIDATION_MESSAGES.RELEASE_TOO_FUTURE(maxReleaseYear),
          ],
        });
      },
    );

    test('Should throw 400 (Validation). animeId must be present in Anime database', async () => {
      const body = getValidEpisodeBody();
      jest.spyOn(animeService, 'get').mockResolvedValueOnce(null);
      const response = await request(app).post('/api/episode').send(body);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: [EPISODE_VALIDATION_MESSAGES.ANIME_NOT_FOUND(body.animeId)],
      });
    });

    test('Should throw 400 (Validation). Required fields must be specified', async () => {
      const response = await request(app).post('/api/episode').send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          'orderToWatch should not be empty',
          'releaseDate should not be empty',
          'animeId should not be empty',
        ]),
      });
    });

    test('Should throw 400 (Validation). Required fields must be not empty', async () => {
      const body = {
        orderToWatch: '',
        releaseDate: '',
        animeId: '',
      };
      const response = await request(app).post('/api/episode').send(body);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          'orderToWatch should not be empty',
          'releaseDate must be a Date instance',
          'animeId should not be empty',
        ]),
      });
    });

    test('Should throw 409 (Duplicate). orderToWatch must be unique in anime', async () => {
      const body = getValidEpisodeBody();

      const errorMessages = [
        ERROR_MESSAGES.DUPLICATE('animeId', body.animeId),
        ERROR_MESSAGES.DUPLICATE('orderToWatch', body.orderToWatch.toString()),
      ];

      jest
        .spyOn(episodeService, 'create')
        .mockRejectedValueOnce(new DuplicateException(errorMessages));

      const response = await request(app).post('/api/episode').send(body);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        errors: expect.arrayContaining(errorMessages),
      });
    });

    test('Should throw 400 (Validation). Field types must be valid', async () => {
      const body = {
        title: 12345,
        orderToWatch: 0.5,
        releaseDate: 'not-a-date',
        animeId: 1000,
      };

      const response = await request(app).post('/api/episode').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          'title must be a string',
          'orderToWatch must be an integer number',
          'releaseDate must be a Date instance',
          'animeId must be a UUID',
        ]),
      });
    });
  });

  describe('GET /api/episode', () => {
    // get episodes in anime

    test('Should return an empty list', async () => {
      const params = {
        animeId: randomUUID(),
        from: 0,
        size: 1,
      };
      jest
        .spyOn(episodeService, 'getEpisodesInAnime')
        .mockResolvedValueOnce([]);
      const response = await request(app).get('/api/episode').query(params);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test('Should return list with default from and size params', async () => {
      const params = {
        animeId: randomUUID(),
      };
      jest
        .spyOn(episodeService, 'getEpisodesInAnime')
        .mockResolvedValueOnce([]);
      const response = await request(app).get('/api/episode').query(params);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test('Should return list of anime episodes', async () => {
      const animeId = randomUUID();

      const episodes = [
        plainToInstance(EpisodeInfoDto, {
          id: new mongoose.Types.ObjectId().toString(),
          title: 'Episode 1: The Beginning',
          orderToWatch: 1,
          releaseDate: new Date('2010-01-01').toISOString(),
          animeId: animeId,
        }),
        plainToInstance(EpisodeInfoDto, {
          id: new mongoose.Types.ObjectId().toString(),
          title: 'Episode 2: The Journey',
          orderToWatch: 2,
          releaseDate: new Date('2010-01-08').toISOString(),
          animeId: animeId,
        }),
        plainToInstance(EpisodeInfoDto, {
          id: new mongoose.Types.ObjectId().toString(),
          title: 'Episode 3: The Conflict',
          orderToWatch: 3,
          releaseDate: new Date('2010-01-15').toISOString(),
          animeId: animeId,
        }),
      ];

      jest
        .spyOn(episodeService, 'getEpisodesInAnime')
        .mockResolvedValueOnce(episodes);

      const response = await request(app)
        .get('/api/episode')
        .query({ animeId });
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
    });

    test('Should throw 400 (Validation). animeId must be present in Anime database', async () => {
      const animeId = randomUUID();
      jest.spyOn(animeService, 'get').mockResolvedValueOnce(null);
      const response = await request(app)
        .get('/api/episode')
        .query({ animeId });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: [EPISODE_VALIDATION_MESSAGES.ANIME_NOT_FOUND(animeId)],
      });
    });

    test('Should throw 400 (Validation). Required fields must be specified', async () => {
      const response = await request(app).get('/api/episode').query({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining(['animeId should not be empty']),
      });
    });

    test('Should throw 400 (Validation). Required fields must be not empty', async () => {
      const response = await request(app).get('/api/episode').query({
        animeId: '',
      });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining(['animeId should not be empty']),
      });
    });

    test('Should throw 400 (Validation). Size and from must not be less than 0', async () => {
      const response = await request(app).get('/api/episode').query({
        animeId: randomUUID(),
        size: -1,
        from: -1,
      });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          'size must not be less than 1',
          'from must not be less than 0',
        ]),
      });
    });

    test('Should throw 400 (Validation). Query params must be valid types', async () => {
      const params = {
        animeId: 'not-a-uuid',
        size: 10.5,
        from: 'start',
      };

      const response = await request(app).get('/api/episode').query(params);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          'animeId must be a UUID',
          'size must be an integer number',
          'from must be an integer number',
        ]),
      });
    });
  });

  describe('POST /api/episode/_counts', () => {
    // count episodes in each anime

    test('Should count episodes in anime', async () => {
      const animeIds = Array.from({ length: 3 }, () => randomUUID());
      const mockCounts = Object.fromEntries(
        animeIds.map((id, index) => [id, (index + 1) * 10]),
      );
      jest
        .spyOn(episodeService, 'countEpisodes')
        .mockResolvedValueOnce(mockCounts);
      const response = await request(app)
        .post('/api/episode/_counts')
        .send({ animeIds });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCounts);
      expect(episodeService.countEpisodes).toHaveBeenCalledWith(animeIds);
    });

    test(
      'Should allow ' +
        EPISODE_CONFIG.MAX_SIZE_ID_LIST +
        ' animeIds (exactly the limit)',
      async () => {
        const exactLimitIds = Array.from(
          { length: EPISODE_CONFIG.MAX_SIZE_ID_LIST },
          () => randomUUID(),
        );

        jest.spyOn(episodeService, 'countEpisodes').mockResolvedValueOnce({});

        const response = await request(app)
          .post('/api/episode/_counts')
          .send({ animeIds: exactLimitIds });

        expect(response.status).toBe(200);
      },
    );

    test('Should throw 400 (Validation). animeIds must not exceed max size', async () => {
      const overLimitIds = Array.from(
        { length: EPISODE_CONFIG.MAX_SIZE_ID_LIST + 1 },
        () => randomUUID(),
      );

      const response = await request(app)
        .post('/api/episode/_counts')
        .send({ animeIds: overLimitIds });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          'animeIds must contain no more than ' +
            EPISODE_CONFIG.MAX_SIZE_ID_LIST +
            ' elements',
        ]),
      });
    });

    test('Should throw 400 (Validation). animeIds must be an array of UUIDs', async () => {
      const response = await request(app)
        .post('/api/episode/_counts')
        .send({ animeIds: ['not-a-uuid', 123] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          'each value in animeIds must be a UUID',
        ]),
      });
    });

    test('Should throw 400 (Validation). Each animeId in the list must exist in Anime db', async () => {
      const validId = randomUUID();
      const invalidId1 = randomUUID();
      const invalidId2 = randomUUID();
      const animeIds = [invalidId1, validId, invalidId2];

      jest.spyOn(animeService, 'get').mockImplementation(async (id: string) => {
        if (id === validId) return mockAnime(id);
        return null;
      });

      const response = await request(app)
        .post('/api/episode/_counts')
        .send({ animeIds });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining([
          EPISODE_VALIDATION_MESSAGES.ANIME_NOT_FOUND(invalidId1),
          EPISODE_VALIDATION_MESSAGES.ANIME_NOT_FOUND(invalidId2),
        ]),
      });
    });

    test('Should throw 400 (Validation). Required fields must be specified', async () => {
      const response = await request(app).post('/api/episode/_counts').send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining(['animeIds should not be empty']),
      });
    });

    test('Should throw 400 (Validation). Required fields must be not empty', async () => {
      const response = await request(app).post('/api/episode/_counts').send({
        animeIds: [],
      });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining(['animeIds should not be empty']),
      });
    });

    test('Should throw 400 (Validation). animeIds must be an array', async () => {
      const response = await request(app)
        .post('/api/episode/_counts')
        .send({ animeIds: 'single-id-not-array' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: expect.arrayContaining(['animeIds must be an array']),
      });
    });

    test('Should handle duplicate animeIds in request', async () => {
      const id = randomUUID();
      const animeIds = [id, id, id];
      const mockCounts = { [id]: 5 };

      jest.spyOn(animeService, 'get').mockResolvedValue(mockAnime(id));
      jest
        .spyOn(episodeService, 'countEpisodes')
        .mockResolvedValueOnce(mockCounts);

      const response = await request(app)
        .post('/api/episode/_counts')
        .send({ animeIds });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCounts);
      expect(Object.keys(response.body)).toHaveLength(1);
    });
  });
});
