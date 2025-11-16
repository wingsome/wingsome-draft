import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RelationResponseDto } from './dto/relation-response.dto';
import { RelationType } from './enum/relation-type.enum';
import { RelationService } from './relation.service';
import { ProfileService } from 'src/profile/profile.service';

@Controller('relation')
export class RelationController {
  constructor(
    private readonly relationService: RelationService
  ) {}
  
  @Post(':targetUserId')
  @ApiOperation({
    summary: '지인 요청',
    description: '상대 회원에게 지인 관계 맺기를 요청합니다.'
  })
  @ApiParam({ name: 'targetUserId', type: Number, description: '상대 회원 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      relationType: { type: 'string', enum: Object.values(RelationType), description: '관계 유형', nullable: false }
    },
    required: ['relationType']
  } })
  @ApiResponse({ status: 201, description: '요청 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  @ApiResponse({ status: 409, description: '이미 등록된 관계' })
  async createRelation(
    @Request() request,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body('relationType') relationType: RelationType
  ) {
    if (!relationType) throw new BadRequestException('relationType should not be empty');
    if (!Object.values(RelationType).includes(relationType)) {
      throw new BadRequestException('relationType must be one of the following values: FRIEND, FAMILY, COWORKER, OTHER');
    }
    return await this.relationService.createRelation(request.user.sub, targetUserId, relationType);
  }
  
  @Get()
  @ApiOperation({
    summary: '지인 목록 조회',
    description: '회원의 보낸/받은 지인(요청) 목록을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: RelationResponseDto })
  async getRelations(
    @Request() request
  ) {
    return await this.relationService.getRelations(request.user.sub);
  }
  
  @Patch(':relationId/type')
  @ApiOperation({
    summary: '지인 관계 유형 수정',
    description: '지인 관계 유형을 수정합니다.'
  })
  @ApiParam({ name: 'relationId', type: Number, description: '지인 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      relationType: { type: 'string', enum: Object.values(RelationType), description: '관계 유형', nullable: false }
    },
    required: ['relationType']
  } })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 관계' })
  async updateRelationType(
    @Request() request,
    @Param('relationId', ParseIntPipe) relationId: number,
    @Body('relationType') relationType: RelationType
  ) {
    if (!relationType) throw new BadRequestException('relationType should not be empty');
    if (!Object.values(RelationType).includes(relationType)) {
      throw new BadRequestException('relationType must be one of the following values: FRIEND, FAMILY, COWORKER, OTHER');
    }
    return await this.relationService.updateRelationType(request.user.sub, relationId, relationType);
  }
  
  @Patch(':relationId/accepte')
  @ApiOperation({
    summary: '지인 요청 수락: 요청 처리 상태 수정',
    description: '지인 요청 처리 상태를 "수락"으로 수정합니다.'
  })
  @ApiParam({ name: 'relationId', type: Number, description: '지인 ID',  required: true })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 관계' })
  async updateeRelationStatus(
    @Request() request,
    @Param('relationId', ParseIntPipe) relationId: number
  ) {
    return await this.relationService.updateeRelationStatus(request.user.sub, relationId);
  }
  
  @Delete(':relationId')
  @ApiOperation({
    summary: '지인(요청) 삭제',
    description: '지인 관계 및 윙커 프로필 등록 관계를 함께 삭제합니다.'
  })
  @ApiParam({ name: 'relationId', type: Number, description: '지인 ID',  required: true })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 관계' })
  async deleteRelation(
    @Request() request,
    @Param('relationId', ParseIntPipe) relationId: number
  ) {
    return await this.relationService.deleteRelation(request.user.sub, relationId);
  }
}
