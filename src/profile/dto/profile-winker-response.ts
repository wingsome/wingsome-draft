import { ApiProperty } from '@nestjs/swagger';
import { Education, MBTI, Smoke, Tattoo } from '../enum/profile-winker.enum';
import { Gender } from '../enum/profile-user.enum';

export class Image {
  @ApiProperty({ description: '이미지 URL 또는 S3 Key' })
  url: string;

  @ApiProperty({ description: '정렬 순서' })
  priority: number;
}

export class ProfileWinkerResponseDto {
  @ApiProperty({ description: '프로필 등록 ID' })
  registerId: number;

  @ApiProperty({ description: '윙커 프로필 ID' })
  profileWinkerId: number;

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

  @ApiProperty({ description: '자기소개', required: false })
  bio?: string | null;

  @ApiProperty({ description: '윙커 회원의 프로필 활성화 여부' })
  isActiveByWinker: boolean;

  @ApiProperty({ description: '회원의 프로필 활성화 여부' })
  isActiveByUser: boolean;

  @ApiProperty({ description: '정렬 순서' })
  priority: number;

  @ApiProperty({ type: [Image], description: '프로필 이미지 목록' })
  images: Image[];
}
