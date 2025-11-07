import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProfileWinker } from "./profile-winker.entity";
import { Exclude } from "class-transformer";

@Entity('profile_winker_image', { comment: '윙커 프로필에 연결된 이미지 목록' })
export class ProfileWinkerImage {
  @Exclude()
  @PrimaryGeneratedColumn({ comment: '윙커 프로필 이미지 ID' })
  id: number;

  @Exclude()
  @Column({ name: 'profile_winker_id', type: 'int', comment: '윙커 프로필 ID(FK)' })
  profileWinkerId: number;

  @Column({ name: 'url', type: 'varchar', length: 255, comment: '이미지 저장 경로(S3 Key/URL)' })
  url: string;

  @Column({ name: 'sort', type: 'smallint', default: 0, comment: '정렬 순서' })
  sort: number;

  @ManyToOne(
    () => ProfileWinker,
    (profileWinker) => profileWinker.images,
    { onDelete: 'CASCADE', nullable: false }
  )
  @JoinColumn({ name: 'profile_winker_id' })
  profileWinker: ProfileWinker;
}