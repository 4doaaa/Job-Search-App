import { 
  Controller, 
  Post, 
  Patch, 
  Delete, 
  Get, 
  Query, 
  Param, 
  Body, 
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
  InternalServerErrorException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnershipGuard } from './guards/ownership.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema/user.schema';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  private createResponse(statusCode: HttpStatus, message: string, data: any) {
    return { statusCode, message, data };
  }

  @Post('add')
  @Roles(Role.USER)
  async createCompany(@Body() createCompanyDto: CreateCompanyDto, @Request() req: any) {
    try {
      const company = await this.companyService.createCompany(createCompanyDto, req.user.sub);
      
      return this.createResponse(HttpStatus.CREATED, 'Company created successfully', company);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; 
      }
      console.error('CompanyController - Error creating company:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  @Roles(Role.USER)
  async updateCompany(
    @Param('id') id: string, 
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req: any
  ) {
    try {
      const company = await this.companyService.updateCompany(id, updateCompanyDto, req.user);
      return this.createResponse(HttpStatus.OK, 'Company updated successfully', company);
    } catch (error) {
      console.error('CompanyController - Error updating company:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @Roles(Role.USER)
  async softDeleteCompany(@Param('id') id: string, @Request() req: any) {
    try {
      const result = await this.companyService.softDeleteCompany(id, req.user);
      return this.createResponse(HttpStatus.OK, result.message, null);
    } catch (error) {
      console.error('CompanyController - Error deleting company:', error);
      throw error;
    }
  }

  @Get('search')
  async searchCompanies(@Query('name') name: string) {
    try {
      const companies = await this.companyService.searchCompaniesByName(name);
      return this.createResponse(HttpStatus.OK, 'Companies retrieved successfully', companies);
    } catch (error) {
      console.error('CompanyController - Error searching companies:', error);
      throw error;
    }
  }

  @Get(':id')
  async getCompany(@Param('id') id: string) {
    try {
      const company = await this.companyService.getCompanyWithJobs(id);
      return this.createResponse(HttpStatus.OK, 'Company retrieved successfully', company);
    } catch (error) {
      console.error('CompanyController - Error getting company:', error);
      throw error;
    }
  }

  @Patch(':id/logo')
  @UseGuards(OwnershipGuard)
  @Roles(Role.USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    try {
      const company = await this.companyService.uploadLogo(id, file, req.user);
      return this.createResponse(HttpStatus.OK, 'Logo uploaded successfully', company);
    } catch (error) {
      console.error('CompanyController - Error uploading logo:', error);
      throw error;
    }
  }

  @Patch(':id/cover')
  @UseGuards(OwnershipGuard)
  @Roles(Role.USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCoverPic(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    try {
      const company = await this.companyService.uploadCoverPic(id, file, req.user);
      return this.createResponse(HttpStatus.OK, 'Cover picture uploaded successfully', company);
    } catch (error) {
      console.error('CompanyController - Error uploading cover pic:', error);
      throw error;
    }
  }
  @Delete(':id/logo')
  @UseGuards(OwnershipGuard)
  @Roles(Role.USER)
  async deleteLogo(@Param('id') id: string, @Request() req: any) {
    try {
      const company = await this.companyService.deleteLogo(id, req.user);
      return this.createResponse(HttpStatus.OK, 'Logo deleted successfully', company);
    } catch (error) {
      console.error('CompanyController - Error deleting logo:', error);
      throw error;
    }
  }

  @Delete(':id/cover')
  @UseGuards(OwnershipGuard)
  @Roles(Role.USER)
  async deleteCoverPic(@Param('id') id: string, @Request() req: any) {
    try {
      const company = await this.companyService.deleteCoverPic(id, req.user);
      return this.createResponse(HttpStatus.OK, 'Cover picture deleted successfully', company);
    } catch (error) {
      console.error('CompanyController - Error deleting cover pic:', error);
      throw error;
    }
  }
}
