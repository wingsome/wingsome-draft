import { BadRequestException, Body, Controller, Delete, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '회원 가입', description: '신규 계정을 생성하거나, 탈퇴 계정을 복구합니다.' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 409, description: '이미 등록 혹은 삭제된 계정(연락처)' })
  async createUser(
    @Body() request: CreateUserDto
  ) {
    return this.userService.createUser(request);
  }

  @Patch('/:id')
  @ApiOperation({ summary: '비밀번호 변경', description: '기존 회원의 비밀번호를 변경합니다.' })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiResponse({ status: 200, description: '변경 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(id, request.newPassword);
  }

  @Delete('/:id')
  @ApiOperation({ summary: '회원 탈퇴', description: '비밀번호를 검증 후 계정을 삭제합니다.' })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiBody({ schema: {
    properties: {
      password: { type: 'string', description: '본인 인증용 비밀번호', nullable: false }
    },
    required: ['password']
  } })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락' })
  @ApiResponse({ status: 401, description: '비밀번호 인증 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ) {
    if (!password)  throw new BadRequestException('Password is required.');
    return this.userService.deleteUser(id, password);
  }
}
