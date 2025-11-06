import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateWingkerActiveDto {
  @ApiProperty({ description: '활성화(true)/비활성화(false)', required: true, nullable: false })
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
}