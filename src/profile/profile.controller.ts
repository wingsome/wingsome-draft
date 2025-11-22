import { BadRequestException, Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, Put, Query, Request, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BooleanFieldPipe } from 'src/common/pipe/boolean-field.pipe';
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';
import { UpdateProfileWinkerDto } from './dto/update-profile-winker.dto';
import { ProfileService } from './profile.service';
import { WinkerRegisteredResponseDto } from './dto/winker-registered-response';
import { UpdatePriorityBioDto } from './dto/update-priority-bio.dto';
import { WinkerInDepthsResponseDto } from './dto/winker-in-depths-response';

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
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
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
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileUser(
    @Request() request
  ) {
    return this.profileService.getProfileUser(request.user.sub);
  }

  @Put('winker')
  @ApiOperation({
    summary: '내 윙커 프로필 생성 및 수정',
    description: '회원의 윙커 프로필을 생성 및 수정합니다.'
  })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
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
    description: '회원의 윙커 프로필 및 지인 등록 현황을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileWinker(
    @Request() request
  ) {
    return this.profileService.getProfileWinker(request.user.sub);
  }

  @Patch('winker/visible')
  @ApiOperation({
    summary: '내 윙커 프로필 노출 여부 수정',
    description: '회원의 윙커 프로필을 노출/미노출합니다.'
  })
  @ApiBody({ schema: {
    properties: {
      visible: { type: 'boolean', description: '노출(true)/미노출(false) 여부', nullable: false }
    },
    required: ['visible']
  } })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async updateProfileWinkerVisible(
    @Request() request,
    @Body('visible', new BooleanFieldPipe('visible')) visible: boolean
  ) {
    return this.profileService.updateProfileWinkerVisible(request.user.sub, visible);
  }

  @Patch('winker/bios/priority')
  @ApiOperation({
    summary: '내 윙커 프로필 등록 지인 정렬 순서 재지정',
    description: '회원 윙커 프로필을 등록한 지인의 정렬 순서를 드래그 앤 드랍으로 재지정합니다.'
  })
  @ApiBody({
    type: () => UpdatePriorityBioDto, isArray: true,
    examples: { default: { value: [{ registerId: 0, priority: 0 }] } }
  })
  @ApiResponse({ status: 200, description: '재지정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 등록 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필 또는 등록 관계' })
  async updateProfileWinkerRegistersPriority(
    @Request() request,
    @Body() dto: UpdatePriorityBioDto[]
  ) {
    return this.profileService.updateProfileWinkerRegistersPriority(request.user.sub, dto);
  }
  
  @Post('register/:targetUserId')
  @ApiOperation({
    summary: '지인 프로필 등록',
    description: '상대 회원의 윙커 프로필을 등록합니다.'
  })
  @ApiParam({ name: 'targetUserId', type: Number, description: '상대 회원 ID',  required: true })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 지인 관계' })
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
    description: '회원이 등록한 지인 윙커 프로필 및 등록 현황 목록을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: [WinkerRegisteredResponseDto] })
  async getProfileWinkersRegistered(
    @Request() request
  ) {
    return this.profileService.getProfileWinkersRegistered(request.user.sub);
  }

  @Put('register/:registerId/bio')
  @ApiOperation({
    summary: '등록한 지인 윙커 평판 생성/수정',
    description: '회원이 등록한 지인 윙커의 평판을 생성 및 수정합니다.'
  })
  @ApiParam({ name: 'registerId', type: Number, description: '프로필 등록 ID',  required: true })
  @ApiBody({ schema: {
    properties: {
      bio: { type: 'string', description: '평판', nullable: false }
    },
    required: ['bio']
  } })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 등록 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 등록 관계' })
  async updateProfileWinkerRegisteredBio(
    @Request() request,
    @Param('registerId', ParseIntPipe) registerId: number,
    @Body('bio') bio: string
  ) {
    // if (!bio) throw new BadRequestException('bio should not be empty');
    return this.profileService.updateProfileWinkerRegisteredBio(request.user.sub, registerId, bio);
  }

  @Delete(':registerId/bio')
  @ApiOperation({
    summary: '평판 삭제',
    description: '내 윙커 프로필의 평판 혹은 내가 작성한 평판을 삭제합니다.'
  })
  @ApiParam({ name: 'registerId', type: Number, description: '프로필 등록 ID',  required: true })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 등록 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필 또는 등록 관계' })
  async deleteProfileWinkerRegisteredBio(
    @Request() request,
    @Param('registerId', ParseIntPipe) registerId: number
  ) {
    return this.profileService.deleteProfileWinkerRegisteredBio(request.user.sub, registerId);
  }

  @Delete(':registerId')
  @ApiOperation({
    summary: '윙커 프로필 등록 삭제',
    description: '등록한 혹은 등록된 관계를 삭제합니다.'
  })
  @ApiParam({ name: 'registerId', type: Number, description: '프로필 등록 ID',  required: true })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 403, description: '권한 없는 등록 관계' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필 또는 등록 관계' })
  async deleteProfileWinkerRegistered(
    @Request() request,
    @Param('registerId', ParseIntPipe) registerId: number
  ) {
    return this.profileService.deleteProfileWinkerRegistered(request.user.sub, registerId);
  }

  @Get('users')
  @ApiOperation({
    summary: '지인 프로필 조회',
    description: '연락처 혹은 회원 ID 리스트 기반으로 회원 프로필 리스트를 추출합니다.'
  })
  @ApiQuery({ name: 'phones', type: 'string', required: false, description: '연락처 목록(쉼표 구분)' })
  @ApiQuery({ name: 'userIds', type: 'string', required: false, description: '회원 ID 목록(쉼표 구분)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  async getProfileUsers(
    @Query('phones', new ParseArrayPipe({ items: String, separator: ',', optional: true })) phones?: string[],
    @Query('userIds', new ParseArrayPipe({ items: Number, separator: ',', optional: true })) userIds?: number[]
  ) {
    if ((!phones || phones.length === 0) && (!userIds || userIds.length === 0)) {
      throw new BadRequestException('one of phones or userIds should not be empty');
    }
    return this.profileService.getProfileUsers({ phones, userIds });
  }

  @Get('winkers')
  @ApiOperation({
    summary: '모든 윙커 프로필 목록 조회',
    description: '회원 및 지인이 등록한 모든 윙커 프로필을 조회합니다.'
  })
  @ApiQuery({ name: 'maxDepth', type: 'number', required: true, description: '지인 연결 최대값' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [WinkerInDepthsResponseDto] })
  async getProfileWinkers(
    @Request() request,
    @Query('maxDepth', ParseIntPipe) maxDepth: number
  ) {
    return this.profileService.getProfileWinkers(request.user.sub, maxDepth);
  }
}
