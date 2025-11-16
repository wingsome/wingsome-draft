import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdatePriorityBioDto {
  @ApiProperty({ description: '프로필 등록 ID', required: true, nullable: false })
  @IsNotEmpty()
  @IsNumber()
  registerId: number;

  @ApiProperty({ description: '정렬 순서', required: true, nullable: false })
  @IsNotEmpty()
  @IsNumber()
  priority: number;
}
