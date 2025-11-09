import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MBTI, Smoke, Tattoo } from "../enum/profile-winker.enum";
import { ProfileWinkerImage } from "./profile-winker-image.entity";
import { Exclude } from "class-transformer";

@Entity('profile_winker', { comment: '윙커 프로필 정보' })
export class ProfileWinker {
  @Exclude()
  @PrimaryGeneratedColumn({ comment: '윙커 프로필 ID' })
  id: number;

  @Exclude()
  @Column({ name: 'user_id', type: 'int', unique: true, comment: '회원 ID' })
  userId: number;

  @Column({ name: 'region_si', type: 'varchar', length: 100, comment: '지역(시)' })
  regionSi: string;

  @Column({ name: 'region_gu', type: 'varchar', length: 100, comment: '지역(구)' })
  regionGu: string;

  @Column({ name: 'job', type: 'varchar', length: 100, comment: '회사/직무' })
  job: string;

  @Column({ name: 'tall', type: 'smallint', comment: '키' })
  tall: number;

  @Column({ name: 'mbti', type: 'enum', enum: MBTI, enumName: 'user_mbti_enum', nullable: true, comment: 'MBTI' })
  mbti: MBTI | null;

  @Column({ name: 'smoke', type: 'enum', enum: Smoke, enumName: 'user_smoke_enum', nullable: true, comment: '흡연 여부' })
  smoke: Smoke | null;

  @Column({ name: 'tattoo', type: 'enum', enum: Tattoo, enumName: 'user_tattoo_enum', nullable: true, comment: '문신 여부' })
  tattoo: Tattoo | null;

  @Column({ name: 'bio', type: 'text', nullable: true, comment: '자기소개' })
  bio: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '활성화 여부' })
  isActive: boolean;

  @OneToMany(
    () => ProfileWinkerImage,
    (profileWinkerImage) => profileWinkerImage.profileWinker,
    { cascade: ['insert'] }
  )
  images: ProfileWinkerImage[];
}