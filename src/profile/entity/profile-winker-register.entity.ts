import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ProfileWinker } from "./profile-winker.entity";

@Entity('profile_winker_register', { comment: '윙커 프로필 등록 목록' })
@Unique('uq_winker_register', ['profileWinkerId', 'userId'])
export class ProfileWinkerRegister {
  @PrimaryGeneratedColumn({ comment: '프로필 등록 ID' })
  id: number;

  @Column({ name: 'profile_winker_id', type: 'int', comment: '윙커 프로필 ID(FK)' })
  profileWinkerId: number;

  @Column({ name: 'user_id', type: 'int', comment: '등록 회원 ID' })
  userId: number;

  @Column({ name: 'priority', type: 'smallint', default: 0, comment: '정렬 순서' })
  priority: number;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '활성화 여부' })
  isActive: boolean;

  @ManyToOne(
    () => ProfileWinker,
    (profileWinker) => profileWinker.registered,
    { onDelete: 'CASCADE', nullable: true }
  )
  @JoinColumn({ name: 'profile_winker_id' })
  profileWinker: ProfileWinker;
}