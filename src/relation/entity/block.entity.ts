import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { BlockType } from "../enum/block-type.enum";

@Entity('relation_block', { comment: '차단 관계' })
@Unique('uq_block', ['userId', 'targetId'])
export class Block {
  @PrimaryGeneratedColumn({ comment: '차단 ID' })
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '요청 회원 ID' })
  userId: number;

  @Column({ name: 'target_id', type: 'int', comment: '대상 회원 ID' })
  targetId: number;

  @Column({ name: 'block_type', type: 'enum', enum: BlockType, enumName: 'block_type_enum', comment: '차단 유형' })
  blockType: BlockType;
}