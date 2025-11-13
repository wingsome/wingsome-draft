import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ProfileWinker } from "./profile-winker.entity";

@Entity('profile_winker_reputation', { comment: '윙커 프로필에 연결된 지인소개 목록' })
@Unique('uq_winker_reputation', ['profileWinkerId', 'userId'])
export class ProfileWinkerReputation {
  @PrimaryGeneratedColumn({ comment: '윙커 프로필 소개 ID' })
  id: number;

  @Column({ name: 'profile_winker_id', type: 'int', comment: '윙커 프로필 ID(FK)' })
  profileWinkerId: number;

  @Column({ name: 'user_id', type: 'int', comment: '작성 회원 ID' })
  userId: number;

  @Column({ name: 'reputation', type: 'text', comment: '지인소개' })
  reputation: string;

  @Column({ name: 'sort', type: 'smallint', default: 0, comment: '정렬 순서' })
  sort: number;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '활성화 여부' })
  isActive: boolean;

  @ManyToOne(
    () => ProfileWinker,
    (profileWinker) => profileWinker.reputations,
    { onDelete: 'CASCADE', nullable: true }
  )
  @JoinColumn({ name: 'profile_winker_id' })
  profileWinker: ProfileWinker;
}