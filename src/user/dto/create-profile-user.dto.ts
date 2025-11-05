import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { Gender } from "../enum/user.enum";

export class CreateProfileUserDto {
  @ApiProperty({ description: '회원 ID', required: true, nullable: false })
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @ApiProperty({ description: '회원명', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: '출생년도', required: true, nullable: false })
  @IsNotEmpty()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear: number;
  
  @ApiProperty({ enum: Gender, description: '성별', required: true, nullable: false })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: '프로필 이미지 URL', required: false, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  profileImageUrl?: string;

  @ApiProperty({ description: '자기소개', required: false, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  bio?: string;
}
