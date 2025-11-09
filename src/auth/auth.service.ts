import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SignInLocalDto } from './dto/sign-in.dto';
import { envKeys } from 'src/common/const/env.const';

@Injectable()
export class AuthService {
  private refreshCodeStore: Map<number, string> = new Map();

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  private get accessTokenSecret() { return this.configService.get<string>(envKeys.accessTokenSecret); }
  private get refreshTokenSecret() { return this.configService.get<string>(envKeys.refreshTokenSecret); }

  async issueTokenPair(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'access', grade: user.grade, role: user.role },
      { secret: this.accessTokenSecret, expiresIn: '10m' }
    );

    const refreshCode = uuidv4();
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh', code: refreshCode },
      { secret: this.refreshTokenSecret, expiresIn: '1w' }
    );

    this.refreshCodeStore.set(user.id, refreshCode);
    return { accessToken, refreshToken };
  }

  async signInLocal(request: SignInLocalDto)
  : Promise<{ id: number, accessToken: string; refreshToken: string }> {
    const { region, phone, password } = request;

    const user = await this.userRepository.findOne({ where: { region, phone } });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const isMatch = await bcrypt.compare(password, user.pwdHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials.');

    const { accessToken, refreshToken } = await this.issueTokenPair(user);
    return { id: user.id, accessToken, refreshToken };
  }
  
  async refreshToken(id: number, code: string)
  : Promise<{ id: number, newAccessToken: string; newRefreshToken: string }> {
    const storedCode = this.refreshCodeStore.get(id);
    console.log(code);
    console.log(storedCode);
    if (code !== storedCode) throw new UnauthorizedException('Invalid code.');

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('User not found.');

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.issueTokenPair(user);
    return { id, newAccessToken, newRefreshToken };
  }
}
