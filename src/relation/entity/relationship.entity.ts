import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { RelationType } from "../enum/relation-type.enum";
import { RequestStatus } from "src/common/enum/request-status.enum";

@Entity('relationship', { comment: '지인 요청 기록' })
@Unique('uq_relation', ['userMinId', 'userMaxId'])
export class Relationship {
  @PrimaryGeneratedColumn({ comment: '지인 요청 ID' })
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '요청한 회원 ID' })
  userId: number;

  @Column({ name: 'user_min_id', type: 'int', comment: '작은 회원 ID' })
  userMinId: number;

  @Column({ name: 'user_max_id', type: 'int', comment: '큰 회원 ID' })
  userMaxId: number;

  @Column({ name: 'relation_type', type: 'enum', enum: RelationType, enumName: 'relation_type_enum', comment: '관계 유형' })
  relationType: RelationType;

  @Column({ name: 'status', type: 'enum', enum: RequestStatus, enumName: 'request_status_enum', default: RequestStatus.PENDING, comment: '요청 처리 상태' })
  status: RequestStatus;
}