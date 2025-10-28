import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

export class AiTextRequestDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  @IsIn(['professional', 'friendly', 'casual', 'formal', 'humorous'])
  tone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['short', 'medium', 'long'])
  length?: string;
}

export class AiTextResponseDto {
  variants: string[];
}

export class AiImageRequestDto {
  @IsString()
  prompt: string;

  @IsInt()
  @Min(100)
  @Max(4000)
  @IsOptional()
  width?: number;

  @IsInt()
  @Min(100)
  @Max(4000)
  @IsOptional()
  height?: number;
}

export class AiImageResponseDto {
  status: string;
  image_id?: string;
  image_url?: string;
}