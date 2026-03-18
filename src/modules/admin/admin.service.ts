import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema/user.schema';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { AdminDashboardData } from './graphql/admin.types';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Company') private companyModel: Model<CompanyDocument>,
  ) {}

  async getDashboardData(): Promise<AdminDashboardData> {
    const users = await this.userModel.find().exec();
    const companies = await this.companyModel.find().exec();
    
    return {
      users: users as any,
      companies: companies as any,
    };
  }

  async toggleUserBan(userId: string, ban: boolean): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (ban) {
      user.bannedAt = new Date();
    } else {
      user.set('bannedAt', undefined);
    }

    return user.save();
  }

  async toggleCompanyBan(companyId: string, ban: boolean): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    company.isBanned = ban;
    return company.save();
  }

  async approveCompany(companyId: string): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    company.isApproved = true;
    return company.save();
  }
}
