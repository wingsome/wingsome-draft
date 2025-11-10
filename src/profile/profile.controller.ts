import { Body, ClassSerializerInterceptor, Controller, Get, Patch, Put, Request, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BooleanFieldPipe } from 'src/common/pipe/boolean-field.pipe';
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';
import { UpdateProfileWinkerDto } from './dto/update-profile-winker.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Put('user')
  @ApiOperation({
    summary: '기본 프로필 생성 및 수정',
    description: '회원의 기본 프로필을 생성 및 수정합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
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
    summary: '기본 프로필 조회',
    description: '회원의 기본 프로필을 조회합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileUser(
    @Request() request
  ) {
    return this.profileService.getProfileUser(request.user.sub);
  }

  @Put('winker')
  @ApiOperation({
    summary: '윙커 프로필 생성 및 수정',
    description: '회원의 윙커 프로필을 생성 및 수정합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateProfileWinker(
    @Request() request,
    @Body() dto: UpdateProfileWinkerDto,
  ) {
    return this.profileService.updateProfileWinker(request.user.sub, dto);
  }

  @Patch('winker')
  @ApiOperation({
    summary: '윙커 프로필 활성화/비활성화',
    description: '회원의 윙커 프로필을 활성화/비활성화합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiBody({ schema: {
    properties: {
      active: { type: 'boolean', description: '활성화(true)/비활성화(false) 여부', nullable: false }
    },
    required: ['active']
  } })
  @ApiResponse({ status: 200, description: '활성화/비활성화 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateActive(
    @Request() request,
    @Body('active', new BooleanFieldPipe('active')) active: boolean
  ) {
    return this.profileService.updateActive(request.user.sub, active);
  }

  @Get('winker')
  @ApiOperation({
    summary: '윙커 프로필 조회',
    description: '회원의 윙커 프로필을 조회합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileWinker(
    @Request() request
  ) {
    return this.profileService.getProfileWinker(request.user.sub);
  }
}
