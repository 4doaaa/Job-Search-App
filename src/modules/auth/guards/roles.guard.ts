import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '../../users/schemas/user.schema/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    // Check if this is a GraphQL or REST request
    const isGraphQL = context.getHandler().name.includes('Mutation') || 
                     context.getHandler().name.includes('Query') ||
                     context.getClass().name.includes('Resolver');

    let user;
    if (isGraphQL) {
      const ctx = GqlExecutionContext.create(context);
      user = ctx.getContext().req?.user;
    } else {
      // REST request
      const request = context.switchToHttp().getRequest();
      user = request.user;
    }

    console.log('RolesGuard - User role:', user?.role);
    console.log('RolesGuard - Required roles:', requiredRoles);
    
    if (!user) {
      console.log('RolesGuard - No user found in request');
      return false;
    }

    // Allow both Admin and User for company operations
    if (requiredRoles.includes(Role.USER) && (user.role === 'User' || user.role === 'Admin')) {
      console.log('RolesGuard - Access granted for User or Admin');
      return true;
    }

    // Check for other specific roles
    return requiredRoles.some(role => user.role?.toLowerCase() === role.toLowerCase());
  }
}
