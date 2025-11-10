import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get(Public, context.getHandler());
    if(isPublic) return true;

    const request = context.switchToHttp().getRequest();
    if(!request.user || request.user.type !== 'access') return false;

    return true;
  }
}

export const Public = Reflector.createDecorator()