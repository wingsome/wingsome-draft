import { Reflector } from "@nestjs/core";
import { Role } from "src/common/enum/user-grade-role.enum";

export const RBAC = Reflector.createDecorator<Role>()
