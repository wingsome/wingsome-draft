import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Max, Min } from "class-validator";

export class VerifyPhoneDto {
  @ApiProperty({ description: '국가 번호', required: true, nullable: false })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(999)
  country: number;

  @ApiProperty({ description: '연락처', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6,15}$/)
  phone: string;
}
