import { Body, ClassSerializerInterceptor, Controller, Delete, Patch, Post, Request, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiDomain, HttpMethod } from 'src/common/enum/hateoas.enum';
import { HateoasHelper, LinkMap } from 'src/common/hateoas/hateoas.helper';
import { SixDigitPasswordPipe } from '../common/pipe/six-digit-password.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { Public } from 'src/auth/guard/auth.guard';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('User')
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly hateoasHelper: HateoasHelper
  ) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: '회원 가입',
    description: '신규 계정을 생성하거나, 탈퇴 계정을 복구합니다.'
  })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 409, description: '이미 등록 혹은 삭제된 계정(연락처)' })
  async createUser(
    @Body() dto: CreateUserDto
  ) {
    const user = await this.userService.createUser(dto);
    const { accessToken, refreshToken } = await this.authService.issueTokenPair(user);

    const id = user.id;
    const links: LinkMap = this.hateoasHelper.createLinks([
      { name: 'self_user', domain: ApiDomain.USER, endpoint: `profile/user/${id}`, method: HttpMethod.GET },
      { name: 'update_user', domain: ApiDomain.USER, endpoint: `profile/user/${id}`, method: HttpMethod.PUT },
      { name: 'self_winker', domain: ApiDomain.PROFILE, endpoint: `profile/winker/${id}`, method: HttpMethod.GET },
      { name: 'update_winker', domain: ApiDomain.PROFILE, endpoint: `profile/winker/${id}`, method: HttpMethod.PUT },
      { name: 'update_winker_active', domain: ApiDomain.PROFILE, endpoint: `profile/winker/${id}`, method: HttpMethod.PATCH }
    ]);

    return { accessToken, refreshToken, _links: links };
  }

  @Patch()
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
    @Request() request,
    @Body('newPassword', SixDigitPasswordPipe ) newPassword: string
  ) {
    return this.userService.updatePassword(request.user.sub, newPassword);
  }

  @Delete()
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
    @Request() request,
    @Body('password', SixDigitPasswordPipe ) password: string
  ) {
    return this.userService.deleteUser(request.user.sub, password);
  }
}
