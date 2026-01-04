import 'reflect-metadata';
import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { EPISODE_CONFIG } from '../episode.constants';

export class EpisodeCreateDto {
  @Expose()
  @IsString()
  @IsOptional()
  title?: string;

  @Expose()
  @IsNotEmpty()
  @IsInt()
  @Min(EPISODE_CONFIG.MIN_ORDER_TO_WATCH_NUMBER)
  orderToWatch!: number;

  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  releaseDate!: Date;

  @Expose()
  @IsNotEmpty()
  @IsUUID(4)
  animeId!: string;
}
