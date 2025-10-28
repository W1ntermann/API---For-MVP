import { IsString, IsInt, Min, Max, IsIn } from 'class-validator';

export class ExportRequestDto {
  @IsString()
  template_id: string;

  @IsString()
  @IsIn(['png', 'jpg', 'pdf'])
  format: string;

  @IsInt()
  @Min(100)
  @Max(4000)
  width: number;

  @IsInt()
  @Min(100)
  @Max(4000)
  height: number;
}