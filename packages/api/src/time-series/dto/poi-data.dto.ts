import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Validate } from 'class-validator';
import { ReefPointOfInterest } from '../../reef-pois/reef-pois.entity';
import { Reef } from '../../reefs/reefs.entity';
import { EntityExists } from '../../validations/entity-exists.constraint';

export class PoiDataDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Validate(EntityExists, [Reef])
  reefId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Validate(EntityExists, [ReefPointOfInterest])
  poiId: number;
}
