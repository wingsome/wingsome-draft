import { ApiProperty } from '@nestjs/swagger';
import { Education, MBTI, Religion, Smoke, Tattoo } from '../enum/profile-winker.enum';
import { Gender } from '../enum/profile-user.enum';

export class Register {
  @ApiProperty({ description: '지인 회원 ID' })
  userId: number;

  @ApiProperty({ description: '평판', required: false })
  bio?: string | null;
}

export class WinkerInDepthsResponseDto {
  @ApiProperty({ description: '윙커 회원 ID' })
  userId: number;

  @ApiProperty({ description: '이름' })
  name: string;

  @ApiProperty({ description: '출생년도' })
  birthYear: number;

  @ApiProperty({ enum: Gender, description: '성별' })
  gender: Gender;

  @ApiProperty({ description: '지역(시)' })
  region1: string;

  @ApiProperty({ description: '지역(구)' })
  region2: string;

  @ApiProperty({ enum: Education, description: '학력' })
  education: Education;

  @ApiProperty({ description: '회사/직무' })
  job: string;

  @ApiProperty({ description: '키' })
  tall: number;

  @ApiProperty({ enum: MBTI, description: 'MBTI', required: false })
  mbti?: MBTI | null;

  @ApiProperty({ enum: Smoke, description: '흡연 여부', required: false })
  smoke?: Smoke | null;

  @ApiProperty({ enum: Tattoo, description: '문신 여부', required: false })
  tattoo?: Tattoo | null;

  @ApiProperty({ enum: Religion, description: '종교', required: false })
  religion?: Religion | null;

  @ApiProperty({ description: '자기소개', required: false })
  bio?: string | null;

  @ApiProperty({ description: '이미지 URL 또는 S3 Key 목록' })
  images: string[];

  @ApiProperty({ type: [Register], description: '지인 목록' })
  registers: Register[];
}
