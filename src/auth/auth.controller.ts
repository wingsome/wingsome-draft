import { Body, ClassSerializerInterceptor, Controller, ForbiddenException, Post, Request, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SignInLocalDto } from "./dto/sign-in.dto";
import { Public } from "./guard/auth.guard";

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService
  ) {}

  @Public()
  @Post('/signin/local')
  @ApiOperation({
    summary: '로컬 로그인',
    description: '연락처 및 비밀번호 인증 후 AT, RT을 발급합니다.'
  })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 401, description: '연락처 및 비밀번호 인증 실패' })
  async signInLocal(
    @Body() dto: SignInLocalDto
  ) {
    return await this.authService.signInLocal(dto);
  }

  @Public()
  @Post('/refresh')
  @ApiOperation({
    summary: '토큰 재발급',
    description: 'RT 인증 후 AT, RT을 재발급합니다.'
  })
  @ApiResponse({ status: 201, description: '재발급 성공' })
  async refreshToken(
    @Request() request
  ) {
    if (request.user.type !== 'refresh') throw new ForbiddenException('refreshToken is required');
    return await this.authService.refreshToken(request.user.id, request.user.code);
  }
}
