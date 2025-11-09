import { BadRequestException, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, NextFunction } from 'express';
import { envKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private get accessTokenSecret() { return this.configService.get<string>(envKeys.accessTokenSecret); }
  private get refreshTokenSecret() { return this.configService.get<string>(envKeys.refreshTokenSecret); }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new BadRequestException('Authorization header missing.');
    // if (!authHeader) {next(); return;};

    const splited = authHeader.split(' ');
    if (splited.length !== 2) throw new UnauthorizedException('Invalid token format.');

    const [bearer, token] = splited;
    if (bearer.toLowerCase() !== 'bearer') throw new UnauthorizedException('Bearer token is required.');

    try {
      const tokenType = this.jwtService.decode(token).type;
      const payload = await this.jwtService.verifyAsync(token, {
        secret: tokenType === 'access' ? this.accessTokenSecret : this.refreshTokenSecret
      });
      req.user = payload;
      next();
    } catch (err) {
      throw new UnauthorizedException('Expired or Invalid token.');
    }
  }
}
