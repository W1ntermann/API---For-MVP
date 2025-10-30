import { IsString, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectCreateDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}