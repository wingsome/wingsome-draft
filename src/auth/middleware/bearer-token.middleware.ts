import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request } from 'express';
import { envKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private get accessTokenSecret() { return this.configService.get<string>(envKeys.accessTokenSecret)!; }
  private get refreshTokenSecret() { return this.configService.get<string>(envKeys.refreshTokenSecret)!; }
  private get verifyTokenSecret() { return this.configService.get<string>(envKeys.verifyTokenSecret)!; }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {next(); return;};

    try {
      const [, token] = authHeader.split(' ');
      const tokenType = this.jwtService.decode(token).type;

      let secret: string;
      switch (tokenType) {
        case 'access': secret = this.accessTokenSecret; break;
        case 'refresh': secret = this.refreshTokenSecret; break;
        case 'verify': secret = this.verifyTokenSecret; break;
        default: next(); return;
      }
      
      req.user = await this.jwtService.verifyAsync(token, { secret });
      next();
    } catch (e) {
      if(e.name === 'TokenExpiredError') throw new ForbiddenException('Expired token');
      next();
    }
  }
}
