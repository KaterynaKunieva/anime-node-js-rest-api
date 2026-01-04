import express from 'express';
import {
  create,
  getEpisodesInAnime,
  countEpisodes,
} from './episode.controller';
import validateDto from '../middleware/validateDto';
import { GetEpisodesInAnimeDto } from './dto/GetEpisodesInAnimeDto';
import { EpisodeCreateDto } from './dto/EpisodeCreateDto';
import { AnimeIDListDto } from './dto/AnimeIDListDto';

const router = express.Router();

router.post('/episode', validateDto(EpisodeCreateDto), create);
router.get('/episode', validateDto(GetEpisodesInAnimeDto), getEpisodesInAnime);
router.post('/episode/_counts', validateDto(AnimeIDListDto), countEpisodes);

export default router;
