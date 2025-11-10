import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "src/common/enum/user-grade-role.enum";
import { Public } from "./auth.guard";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get(Public, context.getHandler());
    if(isPublic) return true;

    const role = this.reflector.get<Role>(RBAC, context.getHandler());
    if (!role) return true;
    
    const request = context.switchToHttp().getRequest();
    return role <= request.user.role;
  }
}

export const RBAC = Reflector.createDecorator<Role>()