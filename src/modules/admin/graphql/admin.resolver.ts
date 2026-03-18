import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/schemas/user.schema/user.schema';
import { AdminDashboardData, User, Company } from './admin.types';
import { AdminService } from '../admin.service';

@Resolver(() => AdminDashboardData)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => AdminDashboardData, { name: 'dashboardData' })
  @Roles(Role.ADMIN)
  // @UseGuards(RolesGuard) // Temporarily disabled for testing
  async getAdminDashboard(): Promise<AdminDashboardData> {
    console.log('AdminResolver - getAdminDashboard called');
    return this.adminService.getDashboardData();
  }

  @Mutation(() => User)
  @Roles(Role.ADMIN)
  async banUser(@Args('userId', { type: () => String }) userId: string): Promise<any> {
    return this.adminService.toggleUserBan(userId, true);
  }

  @Mutation(() => User)
  @Roles(Role.ADMIN)
  async unbanUser(@Args('userId', { type: () => String }) userId: string): Promise<any> {
    return this.adminService.toggleUserBan(userId, false);
  }

  @Mutation(() => Company)
  @Roles(Role.ADMIN)
  async banCompany(@Args('companyId', { type: () => String }) companyId: string): Promise<any> {
    return this.adminService.toggleCompanyBan(companyId, true);
  }

  @Mutation(() => Company)
  @Roles(Role.ADMIN)
  async unbanCompany(@Args('companyId', { type: () => String }) companyId: string): Promise<any> {
    return this.adminService.toggleCompanyBan(companyId, false);
  }

  @Mutation(() => Company)
  @Roles(Role.ADMIN)
  async approveCompany(@Args('companyId', { type: () => String }) companyId: string): Promise<any> {
    return this.adminService.approveCompany(companyId);
  }
}
