import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from "../../user/enums/role.enum";
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Get the required roles from the @Roles decorator
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // If no roles are required, allow access
        }

        // Get the user object from the request (attached by JwtAuthGuard)
        const { user } = context.switchToHttp().getRequest();

        // Check if the user's role is included in the required roles
        return requiredRoles.some((role) => user.role?.includes(role));
    }
}