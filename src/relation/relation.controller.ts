import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RelationService } from './relation.service';
import { RelationResponseDto } from './dto/relation-response.dto';
import { RelationType } from './enum/relation-type.enum';
import { RequestStatus } from 'src/common/enum/request-status.enum';

@Controller('relation')
export class RelationController {
  constructor(
    private readonly relationService: RelationService
  ) {}
  
  @Post(':userId')
  @ApiOperation({
    summary: '지인 요청',
    description: '상대 회원에게 지인 관계 맺기를 요청합니다.'
  })
  @ApiParam({ name: 'userId', type: Number, description: '상대 회원 ID',  required: true })
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
  async createRelationRequest(
    @Request() request,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('relationType') relationType: RelationType
  ) {
    if (!relationType) throw new BadRequestException('relationType should not be empty');
    if (!Object.values(RelationType).includes(relationType)) {
      throw new BadRequestException('relationType must be one of the following values: FRIEND, FAMILY, COWORKER, OTHER');
    }
    return await this.relationService.createRelationRequest(request.user.sub, userId, relationType);
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
  
  @Patch('type/:id')
  @ApiOperation({
    summary: '지인 관계 유형 수정',
    description: '지인 요청 ID를 기반으로 관계 유형을 수정합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '지인 요청 ID',  required: true })
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
    @Param('id', ParseIntPipe) id: number,
    @Body('relationType') relationType: RelationType
  ) {
    if (!relationType) throw new BadRequestException('relationType should not be empty');
    if (!Object.values(RelationType).includes(relationType)) {
      throw new BadRequestException('relationType must be one of the following values: FRIEND, FAMILY, COWORKER, OTHER');
    }
    return await this.relationService.updateRelationType(id, request.user.sub, relationType);
  }
  
  @Patch('status/:id')
  @ApiOperation({
    summary: '지인 요청 응답: 요청 처리 상태 수정',
    description: '지인 요청 ID를 기반으로 요청 처리 상태를 수정합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '지인 요청 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      status: { type: 'string', enum: [RequestStatus.ACCEPTED, RequestStatus.REJECTED], description: '요청 처리 상태', nullable: false }
    },
    required: ['status']
  } })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 요청' })
  @ApiResponse({ status: 404, description: '존재하지 않는 요청' })
  async updateStatus(
    @Request() request,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: RequestStatus
  ) {
    if (!status) throw new BadRequestException('status should not be empty');
    if (![RequestStatus.ACCEPTED, RequestStatus.REJECTED].includes(status)) {
      throw new BadRequestException('status must be one of the following values: ACCEPTED, REJECTED');
    }
    return await this.relationService.updateStatus(id, request.user.sub, status);
  }
  
  @Delete(':id')
  @ApiOperation({
    summary: '지인 요청 철회',
    description: '지인 요청 ID를 기반으로 삭제합니다.'
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 요청' })
  @ApiResponse({ status: 404, description: '존재하지 않는 요청' })
  async deleteRelationRequest(
    @Request() request,
    @Param('id', ParseIntPipe) id: number
  ) {
    return await this.relationService.deleteRelationRequest(id, request.user.sub);
  }
}
