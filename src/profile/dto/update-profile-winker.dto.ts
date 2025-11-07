import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min, ValidateNested } from "class-validator";
import { MBTI, Smoke, Tattoo } from "../enum/profile.enum";
import { Type } from "class-transformer";

export class UpdateProfileWinkerDto {
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
  
  @ApiProperty({ type: () => Image, description: '프로필 이미지 목록', required: true, nullable: false })
  @ArrayNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Image)
  images: Image[];
}

export class Image {
  @ApiProperty({ description: '이미지 URL 또는 S3 Key', required: true, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty({ description: '정렬 순서', required: true, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  sort: number;
}
