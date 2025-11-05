import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { MBTI, Smoke, Tattoo } from "../enum/user.enum";

export class CreateProfileWingkerDto {
  @ApiProperty({ description: '회원 ID', required: true, nullable: false })
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @ApiProperty({ description: '지역(시)', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  regionSi: string;

  @ApiProperty({ description: '지역(구)', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  regionGu: string;

  @ApiProperty({ description: '회사/직무', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  job: string;

  @ApiProperty({ description: '키', required: true, nullable: false })
  @IsNotEmpty()
  @IsInt()
  @Min(100)
  @Max(250)
  tall: number;

  @ApiProperty({ enum: MBTI, description: 'MBTI', required: false, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(MBTI)
  mbti?: MBTI;

  @ApiProperty({ enum: Smoke, description: '흡연 여부', required: false, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Smoke)
  smoke?: Smoke;

  @ApiProperty({ enum: Tattoo, description: '문신 여부', required: false, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Tattoo)
  tattoo?: Tattoo;

  @ApiProperty({ description: '자기소개', required: false, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  bio?: string;
}
