import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Gender } from "../enum/profile.enum";
import { Exclude } from "class-transformer";

@Entity('profile_user', { comment: '회원 기본 프로필 정보' })
export class ProfileUser {
  @Exclude()
  @PrimaryGeneratedColumn({ comment: '프로필 ID' })
  id: number;

  @Exclude()
  @Column({ name: 'user_id', type: 'int', unique: true, comment: '회원 ID' })
  userId: number;

  @Column({ name: 'name', type: 'varchar', length: 50, comment: '이름' })
  name: string;

  @Column({ name: 'birth_year', type: 'smallint', comment: '출생년도' })
  birthYear: number;

  @Column({ name: 'gender', type: 'enum', enum: Gender, enumName: 'user_gender_enum', comment: '성별' })
  gender: Gender;

  @Column({ name: 'profile_image_url', type: 'varchar', length: 255, nullable: true, comment: '프로필 이미지 URL' })
  profileImageUrl: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true, comment: '자기소개' })
  bio: string | null;
}