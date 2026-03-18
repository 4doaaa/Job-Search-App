import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Company } from '../schemas/company.schema';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(@InjectModel('Company') private companyModel: Model<Company>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if this is a GraphQL or REST request
    const isGraphQL = context.getHandler().name.includes('Mutation') || 
                     context.getHandler().name.includes('Query') ||
                     context.getClass().name.includes('Resolver');

    let user, id, companyId;
    if (isGraphQL) {
      const ctx = GqlExecutionContext.create(context);
      user = ctx.getContext().req?.user;
      id = ctx.getArgs()[0]?.id;
      companyId = ctx.getArgs()[0]?.companyId || ctx.getArgs()[0]?.company?.id;
    } else {
      // REST request
      const request = context.switchToHttp().getRequest();
      user = request.user;
      id = request.params?.id;
      companyId = request.body?.companyId;
    }

    // Check if user exists
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // For job creation, we need to check company ownership via companyId from body
    if (companyId) {
      // Admin override - Admin can access any company
      if (user.role === 'Admin') {
        return true;
      }

      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new ForbiddenException('Company not found');
      }

      // Check if user is the owner
      if (company.owner.toString() !== user.sub) {
        throw new ForbiddenException('You can only access your own company');
      }

      return true;
    }

    // For other routes, use the original logic with id parameter
    if (id) {
      // Admin override - Admin can access any company
      if (user.role === 'Admin') {
        return true;
      }

      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new ForbiddenException('Company not found');
      }

      // Check if user is the owner
      if (company.owner.toString() !== user.sub) {
        throw new ForbiddenException('You can only access your own companies');
      }

      return true;
    }

    // If no companyId or id, this might be a GET route that doesn't need ownership check
    // Let the request proceed and let the service handle validation
    return true;
  }
}
