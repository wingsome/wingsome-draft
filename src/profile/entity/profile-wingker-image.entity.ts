import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProfileWingker } from "./profile-wingker.entity";

@Entity('profile_wingker_image', { comment: '윙커 프로필에 연결된 이미지 목록' })
export class ProfileWingkerImage {
  @PrimaryGeneratedColumn({ comment: '윙커 프로필 이미지 ID' })
  id: number;

  @Column({ name: 'profile_wingker_id', type: 'int', comment: '윙커 프로필 ID(FK)' })
  profileWingkerId: number;

  @Column({ name: 'url', type: 'varchar', length: 255, comment: '이미지 저장 경로(S3 Key/URL)' })
  url: string;

  @Column({ name: 'sort', type: 'smallint', default: 0, comment: '정렬 순서' })
  sort: number;

  @ManyToOne(
    () => ProfileWingker,
    (profileWingker) => profileWingker.images,
    { onDelete: 'CASCADE', nullable: false }
  )
  @JoinColumn({ name: 'profile_wingker_id' })
  profileWingker: ProfileWingker;
}