import { Expose } from 'class-transformer';
import { BaseQueryDto } from '../../common/dto/BaseQueryDto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetEpisodesInAnimeDto extends BaseQueryDto {
  @Expose()
  @IsNotEmpty()
  @IsUUID(4)
  animeId!: string;
}
