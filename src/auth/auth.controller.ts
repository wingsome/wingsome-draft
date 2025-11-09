import { Body, ClassSerializerInterceptor, Controller, Post, Request, UnauthorizedException, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ApiDomain, HttpMethod } from "src/common/enum/hateoas.enum";
import { HateoasHelper, LinkMap } from "src/common/hateoas/hateoas.helper";
import { AuthService } from "./auth.service";
import { SignInLocalDto } from "./dto/sign-in.dto";

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly hateoasHelper: HateoasHelper
  ) {}

  @Post('/signin/local')
  @ApiOperation({
    summary: '로컬 로그인',
    description: '연락처 및 비밀번호 인증 후 AT, RT을 발급합니다.'
  })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 401, description: '연락처 및 비밀번호 인증 실패' })
  async signInLocal(
    @Body() request: SignInLocalDto
  ) {
    const { id, accessToken, refreshToken } = await this.authService.signInLocal(request);
    const links: LinkMap = this.hateoasHelper.createLinks([
      { name: 'self_user', domain: ApiDomain.USER, endpoint: `profile/user/${id}`, method: HttpMethod.GET }
    ]);

    return { accessToken, refreshToken, _links: links };
  }

  @Post('/refresh')
  @ApiOperation({
    summary: '토큰 재발급',
    description: 'RT 인증 후 AT, RT을 재발급합니다.'
  })
  @ApiResponse({ status: 201, description: '재발급 성공' })
  @ApiResponse({ status: 400, description: '토큰 없음' })
  @ApiResponse({ status: 401, description: '토큰 인증 실패' })
  async refreshToken(
    @Request() req
  ) {
    if (req.user.type !== 'refresh') throw new UnauthorizedException('refreshToken is required.');

    const { id, newAccessToken, newRefreshToken }
      = await this.authService.refreshToken(req.user.id, req.user.code);
    const links: LinkMap = this.hateoasHelper.createLinks([
      { name: 'self_user', domain: ApiDomain.USER, endpoint: `profile/user/${id}`, method: HttpMethod.GET }
    ]);

    return { newAccessToken, newRefreshToken, _links: links };
  }
}
