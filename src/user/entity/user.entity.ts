import { Exclude } from "class-transformer";
import { Grade, Role } from "src/common/enum/user-grade-role.enum";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('user', { comment: '회원 계정 정보' })
export class User {
  @PrimaryGeneratedColumn({ comment: '회원 ID' })
  id: number;

  @Column({ name: 'region', type: 'smallint', comment: '국가 번호' })
  region: number;

  @Column({ name: 'phone', type: 'varchar', length: 15, comment: '연락처' })
  phone: string;

  @Column({ name: 'pwd_hash', type: 'char', length: 60, comment: '비밀번호' })
  pwdHash: string;

  @Column({ name: 'grade', type: 'enum', enum: Grade, enumName: 'user_grade_enum', default: Grade.BASIC, comment: '등급' })
  grade: Grade;

  @Column({ name: 'role', type: 'enum', enum: Role, enumName: 'user_role_enum', default: Role.USER, comment: '권한' })
  role: Role;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: '생성 시각' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true, comment: '삭제 시각' })
  deletedAt: Date | null;
}
