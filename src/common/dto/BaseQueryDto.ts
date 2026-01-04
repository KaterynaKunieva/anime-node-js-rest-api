import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class BaseQueryDto {
  @Expose()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  from: number = 0;

  @Expose()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  size: number = 10;
}
