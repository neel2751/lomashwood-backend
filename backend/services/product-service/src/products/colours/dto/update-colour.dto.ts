import { IsString, IsOptional, IsBoolean, IsNumber, Min, Matches, PartialType } from 'class-validator';
import { CreateColourDto } from './create-colour.dto';

export class UpdateColourDto extends PartialType(CreateColourDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Hex code must be a valid hex color (e.g., #FF0000)' })
  hexCode?: string;

  @IsOptional()
  @IsString()
  rgb?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
