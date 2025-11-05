import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('user', { comment: '회원 계정 정보' })
export class User {
  @PrimaryGeneratedColumn({ comment: '회원 ID' })
  id: number;

  @Column({ name: 'region', type: 'smallint', comment: '국가 번호' })
  region: number;

  @Column({ name: 'phone', type: 'varchar', length: 15, unique: true, comment: '연락처' })
  phone: string;

  @Exclude()
  @Column({ name: 'pwd_hash', type: 'char', length: 60, nullable: true, comment: '비밀번호' })
  pwdHash: string | null;

  @Exclude()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: '생성 시각' })
  createdAt: Date;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true, comment: '삭제 시각' })
  deletedAt: Date | null;
}
