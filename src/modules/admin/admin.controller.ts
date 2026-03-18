import { Controller, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema/user.schema';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('approve-company/:companyId')
  @Roles(Role.ADMIN)
  async approveCompany(@Param('companyId') companyId: string) {
    return this.adminService.approveCompany(companyId);
  }

  @Patch('ban-user/:userId')
  @Roles(Role.ADMIN)
  async banUser(@Param('userId') userId: string) {
    return this.adminService.toggleUserBan(userId, true);
  }

  @Patch('ban-company/:companyId')
  @Roles(Role.ADMIN)
  async banCompany(@Param('companyId') companyId: string) {
    return this.adminService.toggleCompanyBan(companyId, true);
  }
}
