import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    // Check if this is a GraphQL or REST request
    const isGraphQL = context.getHandler().name.includes('Mutation') || 
                     context.getHandler().name.includes('Query') ||
                     context.getClass().name.includes('Resolver');

    if (isGraphQL) {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req;
    } else {
      // REST request
      const request = context.switchToHttp().getRequest();
      return request;
    }
  }

  canActivate(context: ExecutionContext) {
    const request = this.getRequest(context);
    return super.canActivate(context);
  }
}
