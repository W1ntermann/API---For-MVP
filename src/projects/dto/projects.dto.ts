import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ProjectCreateDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}