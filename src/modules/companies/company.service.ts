import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CloudinaryService } from './services/cloudinary.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel('Company') private companyModel: Model<CompanyDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto, userId: string): Promise<Company> {
    try {
      const existingCompany = await this.companyModel.findOne({ 
        $or: [
          { companyEmail: createCompanyDto.companyEmail },
          { companyName: createCompanyDto.companyName }
        ]
      });

      if (existingCompany) {
        throw new ForbiddenException('Company with this email or name already exists');
      }

      const company = new this.companyModel({
        ...createCompanyDto,
        owner: new Types.ObjectId(userId), 
        isApproved: false, 
      });

      const result = await company.save();
      return result;
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

 private async validateCompanyOwnership(company: CompanyDocument, user: any): Promise<void> {
  const userId = user.sub || user._id || user.userId || user.id;

  const isOwner = userId && company.owner.toString() === userId.toString();
  const isAdmin = user.role === 'Admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('You can only access your own company');
  }
}

  async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto, user: any): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      await this.validateCompanyOwnership(company, user);

      if (updateCompanyDto.companyEmail || updateCompanyDto.companyName) {
        const conflictCompany = await this.companyModel.findOne({
          _id: { $ne: id },
          $or: [
            { companyEmail: updateCompanyDto.companyEmail },
            { companyName: updateCompanyDto.companyName }
          ]
        });

        if (conflictCompany) {
          throw new ForbiddenException('Company with this email or name already exists');
        }
      }
      Object.assign(company, updateCompanyDto);
      const result = await company.save();
      return result;
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async softDeleteCompany(id: string, user: any): Promise<{ message: string }> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }
      await this.validateCompanyOwnership(company, user);
      await this.companyModel.findOneAndDelete({ _id: id });
    
      return { message: 'Company soft deleted successfully' };
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async getCompanyWithJobs(id: string): Promise<any> {
    try {
      const company = await this.companyModel
        .findById(id)
        .populate('jobs')
        .exec();

      if (!company || company.isDeleted) {
        throw new NotFoundException('Company not found');
      }

      return company;
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async searchCompaniesByName(name: string): Promise<Company[]> {
    try {
      const regex = new RegExp(name, 'i');
      return this.companyModel.find({
        companyName: { $regex: regex },
        isDeleted: false, 
      }).exec();
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async uploadLogo(id: string, file: Express.Multer.File, user: any): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      await this.validateCompanyOwnership(company, user);

      const logoResult = await this.cloudinaryService.updateImage(
        file,
        'company-logos',
        company.logo?.public_id
      );

      company.logo = logoResult;
      const result = await company.save();
      return result;
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async uploadCoverPic(id: string, file: Express.Multer.File, user: any): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      await this.validateCompanyOwnership(company, user);

      const coverPicResult = await this.cloudinaryService.updateImage(
        file,
        'company-cover-pics',
        company.coverPic?.public_id
      );

      company.coverPic = coverPicResult;  
      const result = await company.save();
      return result;
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async deleteLogo(id: string, user: any): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }
      await this.validateCompanyOwnership(company, user);

      if (!company.logo || !company.logo.public_id) {
        throw new BadRequestException('Company does not have a logo to delete');
      }

      await this.cloudinaryService.deleteImage(company.logo.public_id);

      company.logo = undefined;
      const result = await company.save();
      return result;
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async deleteCoverPic(id: string, user: any): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      await this.validateCompanyOwnership(company, user);

      if (!company.coverPic || !company.coverPic.public_id) {
        throw new BadRequestException('Company does not have a cover picture to delete');
      }

      await this.cloudinaryService.deleteImage(company.coverPic.public_id);

      company.coverPic = undefined;
      const result = await company.save();
      return result;
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async uploadCoverImage(id: string, file: Express.Multer.File, userId: string): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      await this.validateCompanyOwnership(company, { sub: userId });

      const coverResult = await this.cloudinaryService.updateImage(
        file,
        'company-cover-images',
        company.coverImage?.public_id
      );

      company.coverImage = coverResult;
      return await company.save();
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }

  async deleteCoverImage(id: string, userId: string): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      await this.validateCompanyOwnership(company, { sub: userId });

      if (company.coverImage?.public_id) {
        await this.cloudinaryService.deleteImage(company.coverImage.public_id);
      }

      company.coverImage = undefined;
      return await company.save();
    } catch (error) {
      console.error('FULL ERROR:', error);
      throw error;
    }
  }
}
