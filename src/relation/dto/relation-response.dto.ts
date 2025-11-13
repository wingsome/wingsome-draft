import { ApiProperty } from "@nestjs/swagger";
import { RelationType } from "../enum/relation-type.enum";
import { RequestStatus } from "src/common/enum/request-status.enum";

export class Relation {
  @ApiProperty({ description: '지인 요청 ID' })
  id: number;

  @ApiProperty({ description: '상대 회원 ID' })
  userId: number;

  @ApiProperty({ enum: RelationType, description: '관계 유형' })
  relationType: RelationType;

  @ApiProperty({ enum: RequestStatus, description: '요청 처리 상태' })
  status: RequestStatus;
}

export class RelationResponseDto {
  @ApiProperty({ type: [Relation], description: '요청한 목록' })
  request: Relation[];

  @ApiProperty({ type: [Relation], description: '요청 받은 목록' })
  requested: Relation[];
}
