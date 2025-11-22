import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class VerifyPhoneDto {
  @ApiProperty({ description: '국가 번호', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{1,3}$/)
  country: string;

  @ApiProperty({ description: '연락처', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[1-9]\d{5,14}$/)
  phone: string;
}
