import { Body, ClassSerializerInterceptor, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SixDigitPasswordPipe } from '../common/pipe/six-digit-password.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { LinkMap, HateoasHelper } from 'src/common/hateoas/hateoas.helper';
import { ApiDomain, HttpMethod } from 'src/common/enum/hateoas.enum';

@ApiTags('User')
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly hateoasHelper: HateoasHelper
  ) {}

  @Post()
  @ApiOperation({
    summary: '회원 가입',
    description: '신규 계정을 생성하거나, 탈퇴 계정을 복구합니다.'
  })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 409, description: '이미 등록 혹은 삭제된 계정(연락처)' })
  async createUser(
    @Body() request: CreateUserDto
  ) {
    const result = await this.userService.createUser(request);

    const id = result.id;
    const links: LinkMap = this.hateoasHelper.createLinks([
      { name: 'self_user', domain: ApiDomain.USER, endpoint: `profile/user/${id}`, method: HttpMethod.GET },
      { name: 'update_user', domain: ApiDomain.USER, endpoint: `profile/user/${id}`, method: HttpMethod.PUT },
      { name: 'self_winker', domain: ApiDomain.PROFILE, endpoint: `profile/winker/${id}`, method: HttpMethod.GET },
      { name: 'update_winker', domain: ApiDomain.PROFILE, endpoint: `profile/winker/${id}`, method: HttpMethod.PUT },
      { name: 'update_winker_active', domain: ApiDomain.PROFILE, endpoint: `profile/winker/${id}`, method: HttpMethod.PATCH }
    ]);

    return { data: result, _links: links };
  }

  @Patch('/:id')
  @ApiOperation({
    summary: '비밀번호 변경',
    description: '기존 회원의 비밀번호를 변경합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiBody({ schema: {
    properties: {
      newPassword: { type: 'string', description: '새 비밀번호', nullable: false }
    },
    required: ['newPassword']
  } })
  @ApiResponse({ status: 200, description: '변경 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword', SixDigitPasswordPipe ) newPassword: string
  ) {
    return this.userService.updatePassword(id, newPassword);
  }

  @Delete('/:id')
  @ApiOperation({
    summary: '회원 탈퇴',
    description: '비밀번호 검증 후 계정을 삭제합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '회원 ID' })
  @ApiBody({ schema: {
    properties: {
      password: { type: 'string', description: '본인 인증용 비밀번호', nullable: false }
    },
    required: ['password']
  } })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 401, description: '비밀번호 인증 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('password', SixDigitPasswordPipe ) password: string
  ) {
    return this.userService.deleteUser(id, password);
  }
}
