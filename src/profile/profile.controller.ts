import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseIntPipe, Patch, Put, UseInterceptors } from '@nestjs/common';
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

  @Put('/user/:id')
  @ApiOperation({
    summary: '기본 프로필 생성 및 수정',
    description: '회원의 기본 프로필을 생성 및 수정합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateProfileUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() request: UpdateProfileUserDto,
  ) {
    return this.profileService.updateProfileUser(userId, request);
  }

  @Get('/user/:id')
  @ApiOperation({
    summary: '기본 프로필 조회',
    description: '회원의 기본 프로필을 조회합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileUser(
    @Param('id', ParseIntPipe) userId: number
  ) {
    return this.profileService.getProfileUser(userId);
  }

  @Put('/winker/:id')
  @ApiOperation({
    summary: '윙커 프로필 생성 및 수정',
    description: '회원의 윙커 프로필을 생성 및 수정합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '생성 및 수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updateProfileWinker(
    @Param('id', ParseIntPipe) userId: number,
    @Body() request: UpdateProfileWinkerDto,
  ) {
    return this.profileService.updateProfileWinker(userId, request);
  }

  @Patch('/winker/:id')
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
    @Param('id', ParseIntPipe) id: number,
    @Body('active', new BooleanFieldPipe('active')) active: boolean
  ) {
    return this.profileService.updateActive(id, active);
  }

  @Get('/winker/:id')
  @ApiOperation({
    summary: '윙커 프로필 조회',
    description: '회원의 윙커 프로필을 조회합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 프로필' })
  async getProfileWinker(
    @Param('id', ParseIntPipe) userId: number
  ) {
    return this.profileService.getProfileWinker(userId);
  }
}
