import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ProfileWinker } from "./profile-winker.entity";
import { Exclude } from "class-transformer";

@Entity('profile_winker_register', { comment: '윙커 프로필 등록 목록' })
@Unique('uq_winker_register', ['profileWinkerId', 'userId'])
export class ProfileWinkerRegister {
  @PrimaryGeneratedColumn({ comment: '프로필 등록 ID' })
  id: number;

  @Exclude()
  @Column({ name: 'profile_winker_id', type: 'int', comment: '윙커 프로필 ID(FK)' })
  profileWinkerId: number;

  @Column({ name: 'user_id', type: 'int', comment: '등록 회원 ID' })
  userId: number;

  @Exclude()
  @Column({ name: 'visible_profile', type: 'boolean', default: true, comment: '프로필 노출 여부(등록자)' })
  visibleProfile: boolean;

  @Column({ name: 'bio', type: 'text', nullable: true, comment: '지인소개' })
  bio: string | null;

  @Column({ name: 'visible_bio', type: 'boolean', default: true, comment: '지인소개 노출 여부' })
  visibleBio: boolean;

  @Column({ name: 'priority_bio', type: 'smallint', default: 0, comment: '지인소개 정렬 순서' })
  priorityBio: number;

  @ManyToOne(
    () => ProfileWinker,
    (profileWinker) => profileWinker.registered,
    { onDelete: 'CASCADE', nullable: true }
  )
  @JoinColumn({ name: 'profile_winker_id' })
  profileWinker: ProfileWinker;
}