import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Education, MBTI, Religion, Smoke, Tattoo } from "../enum/profile-winker.enum";
import { ProfileWinkerImage } from "./profile-winker-image.entity";
import { ProfileWinkerRegister } from "./profile-winker-register.entity";

@Entity('profile_winker', { comment: '윙커 프로필 정보' })
export class ProfileWinker {
  @PrimaryGeneratedColumn({ comment: '윙커 프로필 ID' })
  id: number;

  @Column({ name: 'user_id', type: 'int', unique: true, comment: '회원 ID' })
  userId: number;

  @Column({ name: 'region_1', type: 'varchar', length: 100, comment: '지역(시)' })
  region1: string;

  @Column({ name: 'region_2', type: 'varchar', length: 100, comment: '지역(구)' })
  region2: string;

  @Column({ name: 'education', type: 'enum', enum: Education, enumName: 'winker_education_enum', comment: '학력' })
  education: Education;

  @Column({ name: 'job', type: 'varchar', length: 100, comment: '회사/직무' })
  job: string;

  @Column({ name: 'tall', type: 'smallint', comment: '키' })
  tall: number;

  @Column({ name: 'mbti', type: 'enum', enum: MBTI, enumName: 'winker_mbti_enum', nullable: true, comment: 'MBTI' })
  mbti: MBTI | null;

  @Column({ name: 'smoke', type: 'enum', enum: Smoke, enumName: 'winker_smoke_enum', nullable: true, comment: '흡연 여부' })
  smoke: Smoke | null;

  @Column({ name: 'tattoo', type: 'enum', enum: Tattoo, enumName: 'winker_tattoo_enum', nullable: true, comment: '문신 여부' })
  tattoo: Tattoo | null;

  @Column({ name: 'religion', type: 'enum', enum: Religion, enumName: 'winker_religion_enum', nullable: true, comment: '종교' })
  religion: Religion | null;

  @Column({ name: 'bio', type: 'text', nullable: true, comment: '자기소개' })
  bio: string | null;

  @Column({ name: 'visible', type: 'boolean', default: true, comment: '프로필 노출 여부' })
  visible: boolean;

  @OneToMany(
    () => ProfileWinkerImage,
    (profileWinkerImage) => profileWinkerImage.profileWinker,
    { cascade: ['insert'] }
  )
  images: ProfileWinkerImage[];

  @OneToMany(
    () => ProfileWinkerRegister,
    (profileWinkerRegister) => profileWinkerRegister.profileWinker
  )
  registered: ProfileWinkerRegister[];
}