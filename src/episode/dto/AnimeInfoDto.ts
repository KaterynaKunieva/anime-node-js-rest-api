import { Expose } from 'class-transformer';

export class AnimeInfoDto {
  @Expose()
  id!: string;

  @Expose()
  title!: string;

  @Expose()
  score!: number;

  @Expose()
  releaseYear!: number;

  @Expose()
  author!: string;
}
