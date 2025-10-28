import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';

export class TemplateCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  project_id?: string;

  @IsObject()
  @IsNotEmpty()
  canvas_data: Record<string, any>;
}

export class TemplateUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  canvas_data?: Record<string, any>;
}