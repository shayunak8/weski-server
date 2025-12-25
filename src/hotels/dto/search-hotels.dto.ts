import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class SearchHotelsDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  ski_site: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'from_date must be in format DD/MM/YYYY',
  })
  from_date: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'to_date must be in format DD/MM/YYYY',
  })
  to_date: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(10)
  group_size: number;
}
