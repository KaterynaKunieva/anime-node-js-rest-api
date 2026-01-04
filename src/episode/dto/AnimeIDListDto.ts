import { Expose } from 'class-transformer';
import {
  IsArray,
  IsUUID,
  ArrayNotEmpty,
  ArrayMaxSize,
  IsNotEmpty,
} from 'class-validator';
import { EPISODE_CONFIG } from '../episode.constants';

export class AnimeIDListDto {
  @Expose()
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(EPISODE_CONFIG.MAX_SIZE_ID_LIST)
  @IsUUID(4, { each: true })
  animeIds!: string[];
}
