import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { envKeys } from 'src/common/const/env.const';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { SignInLocalDto } from './dto/sign-in.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';

@Injectable()
export class AuthService {
  private verifyCodeStore: Map<string, number> = new Map();
  private refreshCodeStore: Map<number, string> = new Map();

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  private get accessTokenSecret() { return this.configService.get<string>(envKeys.accessTokenSecret); }
  private get refreshTokenSecret() { return this.configService.get<string>(envKeys.refreshTokenSecret); }
  private get verifyTokenSecret() { return this.configService.get<string>(envKeys.verifyTokenSecret); }

  async generateCode(dto: VerifyPhoneDto): Promise<number> {
    const { country, phone } = dto;
    const key = `${country}:${phone}`;
    const code = randomInt(100000, 999999);
    this.verifyCodeStore.set(key, code);
    return code;
  }

  async verifyCode(dto: VerifyPhoneDto, code: number): Promise<{ verifyToken: string }> {
    const { country, phone } = dto;
    const key = `${country}:${phone}`;
    const storedCode = this.verifyCodeStore.get(key);
    if (!storedCode || code !== storedCode) throw new UnauthorizedException('invalid code');
    this.verifyCodeStore.delete(key);

    const verifyToken = await this.jwtService.signAsync(
      { sub: key, type: 'verify' },
      { secret: this.verifyTokenSecret, expiresIn: '5m' }
    );
    return { verifyToken };
  }

  async signInLocal(dto: SignInLocalDto)
  : Promise<{ accessToken: string; refreshToken: string }> {
    const { country, phone, password } = dto;

    const user = await this.userRepository.findOne({ where: { country, phone } });
    if (!user) throw new NotFoundException('user not found');

    const isMatch = await bcrypt.compare(password, user.pwdHash);
    if (!isMatch) throw new UnauthorizedException('invalid credentials');
    
    return await this.issueTokenPair(user);
  }
  
  async refreshToken(id: number, code: string)
  : Promise<{ accessToken: string; refreshToken: string }> {
    const storedCode = this.refreshCodeStore.get(id);
    if (!storedCode || code !== storedCode) throw new UnauthorizedException('invalid code');
    this.refreshCodeStore.delete(id);

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');

    return await this.issueTokenPair(user);
  }

  async signOut(id: number, code: string): Promise<void> {
    const storedCode = this.refreshCodeStore.get(id);
    if (!storedCode || code !== storedCode) throw new UnauthorizedException('invalid code');
    this.refreshCodeStore.delete(id);
  }

  async issueTokenPair(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'access', grade: user.grade, role: user.role },
      { secret: this.accessTokenSecret, expiresIn: '1d' }
      // { secret: this.accessTokenSecret, expiresIn: '10m' }
    );

    const refreshCode = randomBytes(16).toString('hex');
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh', code: refreshCode },
      { secret: this.refreshTokenSecret, expiresIn: '1w' }
    );
    this.refreshCodeStore.set(user.id, refreshCode);

    return { accessToken, refreshToken };
  }
}
