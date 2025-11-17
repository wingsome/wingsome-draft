import { BadRequestException, Body, ClassSerializerInterceptor, Controller, ParseIntPipe, Post, Query, Request, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SignInLocalDto } from "./dto/sign-in.dto";
import { Public } from "./guard/auth.guard";
import { VerifyPhoneDto } from "./dto/verify-phone.dto";

@Public()
@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService
  ) {}

  @Post('code/request')
  @ApiOperation({
    summary: '연락처 인증 코드 발급',
    description: '연락처 인증 코드(6자리 숫자)를 발급합니다.'
  })
  @ApiResponse({ status: 201, description: '코드 발급 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  async generateCode(
    @Body() dto: VerifyPhoneDto
  ) {
    return await this.authService.generateCode(dto);
  }

  @Post('code/verify')
  @ApiOperation({
    summary: '연락처 인증 코드 검증',
    description: '연락처 인증 코드 검증 후 인증 토큰을 발급합니다.'
  })
  @ApiQuery({ name: 'code', type: 'number', required: true, description: '인증 코드' })
  @ApiResponse({ status: 201, description: '검증 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 401, description: '검증 실패' })
  async verifyCode(
    @Body() dto: VerifyPhoneDto,
    @Query('code', ParseIntPipe) code: number
  ) {
    return await this.authService.verifyCode(dto, code);
  }

  @Post('signin/local')
  @ApiOperation({
    summary: '로컬 로그인',
    description: '연락처 및 비밀번호 인증 후 AT, RT을 발급합니다.'
  })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 401, description: '연락처 및 비밀번호 인증 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async signInLocal(
    @Body() dto: SignInLocalDto
  ) {
    return await this.authService.signInLocal(dto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: '토큰 재발급',
    description: 'RT 인증 후 AT, RT을 재발급합니다.'
  })
  @ApiResponse({ status: 201, description: '재발급 성공' })
  @ApiResponse({ status: 400, description: '필수 값 누락 또는 유효성 오류' })
  @ApiResponse({ status: 401, description: '코드 매칭 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 계정' })
  async refreshToken(
    @Request() request
  ) {
    if (request.user.type !== 'refresh') throw new BadRequestException('refreshToken is required');
    return await this.authService.refreshToken(request.user.sub, request.user.code);
  }
}
