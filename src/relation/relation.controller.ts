import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Request } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RelationResponseDto } from './dto/relation-response.dto';
import { RelationType } from './enum/relation-type.enum';
import { RelationService } from './relation.service';
import { ProfileService } from 'src/profile/profile.service';
import { BlockType } from './enum/block-type.enum';
import { EnumFieldPipe } from 'src/common/pipe/enum-field.pipe';

@Controller('relation')
export class RelationController {
  constructor(
    private readonly relationService: RelationService
  ) {}
  
  @Put(':targetUserId')
  @ApiOperation({
    summary: '지인 관계 생성 및 수정',
    description: '상대 회원에게 지인 관계 맺기를 요청하거나 관계 유형을 수정합니다.'
  })
  @ApiParam({ name: 'targetUserId', type: Number, description: '상대 회원 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      relationType: { type: 'string', enum: Object.values(RelationType), description: '관계 유형', nullable: false }
    },
    required: ['relationType']
  } })
  @ApiResponse({ status: 201, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '차단 혹은 권한 없는 지인 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' }) // ?
  async updateRelation(
    @Request() request,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body('relationType', new EnumFieldPipe('relationType', RelationType)) relationType: RelationType
  ) {
    return await this.relationService.updateRelation(request.user.sub, targetUserId, relationType);
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
  
  @Patch(':relationId')
  @ApiOperation({
    summary: '지인 요청 수락: 요청 처리 상태 수정',
    description: '지인 요청 처리 상태를 "수락"으로 수정합니다.'
  })
  @ApiParam({ name: 'relationId', type: Number, description: '지인 ID',  required: true })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 지인 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 지인 관계' })
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
  @ApiResponse({ status: 403, description: '권한 없는 지인 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 지인 관계' })
  async deleteRelation(
    @Request() request,
    @Param('relationId', ParseIntPipe) relationId: number
  ) {
    return await this.relationService.deleteRelation(request.user.sub, relationId);
  }
  
  @Put('block/:targetUserId')
  @ApiOperation({
    summary: '차단',
    description: '상대 회원을 차단하고, 차단 유형에따라 지인 관계 및 윙커 프로필 등록 관계를 함께 삭제합니다.'
  })
  @ApiParam({ name: 'targetUserId', type: Number, description: '상대 회원 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      blockType: { type: 'string', enum: Object.values(BlockType), description: '차단 유형', nullable: false }
    },
    required: ['blockType']
  } })
  @ApiResponse({ status: 201, description: '차단 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateBlock(
    @Request() request,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body('blockType', new EnumFieldPipe('blockType', BlockType)) blockType: BlockType
  ) {
    return await this.relationService.updateBlock(request.user.sub, targetUserId, blockType);
  }
  
  @Get('block')
  @ApiOperation({
    summary: '차단 목록 조회',
    description: '회원의 차단 목록을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getBlocks(
    @Request() request
  ) {
    return await this.relationService.getBlocks(request.user.sub);
  }
  
  @Delete(':blockId')
  @ApiOperation({
    summary: '차단 해제',
    description: '기존 차단 관계를 삭제합니다.'
  })
  @ApiParam({ name: 'blockId', type: Number, description: '차단 ID',  required: true })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 차단 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 차단 관계' })
  async deleteBlock(
    @Request() request,
    @Param('blockId', ParseIntPipe) blockId: number
  ) {
    return await this.relationService.deleteBlock(request.user.sub, blockId);
  }
}
