import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class SignInLocalDto {
  @ApiProperty({ description: '국가 번호', required: true, nullable: false })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(999)
  region: number;

  @ApiProperty({ description: '연락처', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6,15}$/)
  phone: string;

  @ApiProperty({ description: '비밀번호', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/)
  password: string;
}
