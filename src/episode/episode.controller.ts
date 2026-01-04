import { type Request, type Response, type NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { EpisodeCreateDto } from './dto/EpisodeCreateDto';
import { GetEpisodesInAnimeDto } from './dto/GetEpisodesInAnimeDto';
import { AnimeIDListDto } from './dto/AnimeIDListDto';
import * as episodeService from './episode.service';

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const episodeData = plainToInstance(EpisodeCreateDto, req.body);
    const createdEpisode = await episodeService.create(episodeData);
    res.status(StatusCodes.CREATED).json({ ...createdEpisode });
  } catch (err) {
    next(err);
  }
};

export const getEpisodesInAnime = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = plainToInstance(GetEpisodesInAnimeDto, req.query);
    const animeEpisodes = await episodeService.getEpisodesInAnime(query);
    res.status(StatusCodes.OK).json(animeEpisodes);
  } catch (err) {
    next(err);
  }
};

export const countEpisodes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { animeIds } = plainToInstance(AnimeIDListDto, req.body);
    let results = await episodeService.countEpisodes(animeIds);
    res.status(StatusCodes.OK).json(results);
  } catch (err) {
    next(err);
  }
};
