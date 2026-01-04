import 'reflect-metadata';
import { Expose, Transform } from 'class-transformer';

export class EpisodeInfoDto {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString(), { toClassOnly: true })
  id!: string;

  @Expose()
  title?: string;

  @Expose()
  orderToWatch!: number;

  @Expose()
  @Transform(
    ({ value }) => (value instanceof Date ? value.toISOString() : value),
    { toClassOnly: true },
  )
  releaseDate!: string;

  @Expose()
  animeId!: string;
}
