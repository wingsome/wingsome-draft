import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, Put, Query, Request, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BooleanFieldPipe } from 'src/common/pipe/boolean-field.pipe';
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';
import { UpdateProfileWinkerDto } from './dto/update-profile-winker.dto';
import { ProfileService } from './profile.service';
import { ProfileWinkerResponseDto } from './dto/profile-winker-response';

@ApiTags('Profile')
@Controller('profile')
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Put('user')
  @ApiOperation({
    summary: '내 기본 프로필 생성 및 수정',
    description: '회원의 기본 프로필을 생성 및 수정합니다.'
  })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateProfileUser(
    @Request() request,
    @Body() dto: UpdateProfileUserDto,
  ) {
    return this.profileService.updateProfileUser(request.user.sub, dto);
  }

  @Get('user')
  @ApiOperation({
    summary: '내 기본 프로필 조회',
    description: '회원의 기본 프로필을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileUser(
    @Request() request
  ) {
    return this.profileService.getProfileUser(request.user.sub);
  }

  @Get('users')
  @ApiOperation({
    summary: '지인 프로필 검색',
    description: '연락처 리스트 기반으로 회원 프로필 리스트를 추출합니다.'
  })
  @ApiQuery({
    name: 'phones', type: 'string', required: true, description: '?phones=1011112222,1033334444'
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락' })
  async getProfileUsersByPhones(
    @Query('phones', new ParseArrayPipe({ items: String, separator: ',', optional: false })) phones: string[]
  ) {
    return this.profileService.getProfileUsersByPhones(phones);
  }

  @Put('winker')
  @ApiOperation({
    summary: '내 윙커 프로필 생성 및 수정',
    description: '회원의 윙커 프로필을 생성 및 수정합니다.'
  })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateProfileWinker(
    @Request() request,
    @Body() dto: UpdateProfileWinkerDto,
  ) {
    return this.profileService.updateProfileWinker(request.user.sub, dto);
  }

  @Get('winker')
  @ApiOperation({
    summary: '내 윙커 프로필 조회',
    description: '회원의 윙커 프로필을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileWinker(
    @Request() request
  ) {
    return this.profileService.getProfileWinker(request.user.sub);
  }

  @Patch('winker/active')
  @ApiOperation({
    summary: '내 윙커 프로필 활성화/비활성화',
    description: '회원의 윙커 프로필을 활성화/비활성화합니다.'
  })
  @ApiBody({ schema: {
    properties: {
      active: { type: 'boolean', description: '활성화(true)/비활성화(false) 여부', nullable: false }
    },
    required: ['active']
  } })
  @ApiResponse({ status: 200, description: '활성화/비활성화 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateProfileWinkerActive(
    @Request() request,
    @Body('active', new BooleanFieldPipe('active')) active: boolean
  ) {
    return this.profileService.updateProfileWinkerActive(request.user.sub, active);
  }

  @Patch('winker/:reputationId/active')
  @ApiOperation({
    summary: '내 윙커 프로필의 지인 소개 문구 노출 활성화/비활성화',
    description: '회원의 윙커 프로필의 지인 소개 문구를 노출 활성화/비활성화합니다.'
  })
  @ApiParam({ name: 'reputationId', type: Number, description: '윙커 프로필 소개 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      active: { type: 'boolean', description: '활성화(true)/비활성화(false) 여부', nullable: false }
    },
    required: ['active']
  } })
  @ApiResponse({ status: 200, description: '활성화/비활성화 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 소개 문구' })
  async updateProfileWinkerReputationActive(
    @Request() request,
    @Param('reputationId', ParseIntPipe) reputationId: number,
    @Body('active', new BooleanFieldPipe('active')) active: boolean
  ) {
    return this.profileService.updateProfileWinkerReputationActive(request.user.sub, reputationId, active);
  }
  
  @Post('register/:targetUserId')
  @ApiOperation({
    summary: '지인 윙커 프로필 등록',
    description: '상대 회원의 윙커 프로필을 등록합니다.'
  })
  @ApiParam({ name: 'targetUserId', type: Number, description: '상대 회원 ID',  required: true })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정 또는 프로필' })
  @ApiResponse({ status: 409, description: '이미 등록된 프로필' })
  async registerProfileWinker(
    @Request() request,
    @Param('targetUserId', ParseIntPipe) targetUserId: number
  ) {
    return await this.profileService.registerProfileWinker(request.user.sub, targetUserId);
  }

  @Get('registers')
  @ApiOperation({
    summary: '등록한 지인 윙커 프로필 목록 조회',
    description: '회원의 지인 윙커 프로필 목록을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: [ProfileWinkerResponseDto] })
  async getProfileWinkersRegistered(
    @Request() request
  ) {
    return this.profileService.getProfileWinkersRegistered(request.user.sub);
  }

  @Patch('register/:registerId/active')
  @ApiOperation({
    summary: '등록한 지인 윙커 프로필 활성화/비활성화',
    description: '회원의 지인 윙커 프로필을 활성화/비활성화합니다.'
  })
  @ApiParam({ name: 'registerId', type: Number, description: '프로필 등록 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      active: { type: 'boolean', description: '활성화(true)/비활성화(false) 여부', nullable: false }
    },
    required: ['active']
  } })
  @ApiResponse({ status: 200, description: '활성화/비활성화 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 등록 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 등록 관계' })
  async updateProfileWinkerRegisteredActive(
    @Request() request,
    @Param('registerId', ParseIntPipe) registerId: number,
    @Body('active', new BooleanFieldPipe('active')) active: boolean
  ) {
    return this.profileService.updateProfileWinkerRegisteredActive(request.user.sub, registerId, active);
  }

  @Put('register/:profileWinkerId/reputation')
  @ApiOperation({
    summary: '등록한 지인 윙커 소개 문구 생성/수정',
    description: '회원의 지인 윙커 프로필의 지인 소개 문구를 생성 및 수정합니다.'
  })
  @ApiParam({ name: 'profileWinkerId', type: Number, description: '윙커 프로필 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      reputation: { type: 'string', description: '지인 소개 문구', nullable: false }
    },
    required: ['reputation']
  } })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async updateProfileWinkerRegisteredReputation(
    @Request() request,
    @Param('profileWinkerId', ParseIntPipe) profileWinkerId: number,
    @Body('reputation') reputation: string
  ) {
    return this.profileService.updateProfileWinkerRegisteredReputation(request.user.sub, profileWinkerId, reputation);
  }
}
