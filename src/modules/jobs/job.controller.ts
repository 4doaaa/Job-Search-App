import { Controller, Post, Patch, Delete, Get, HttpStatus, Request, UseGuards, Param, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { OwnershipGuard } from '../../modules/companies/guards/ownership.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { Role } from '../../modules/users/schemas/user.schema/user.schema';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { GetJobsDto } from './dto/get-jobs.dto';
import { GetAllJobsDto } from './dto/get-all-jobs.dto';
import { CreateApplicationDto } from '../applications/dto/create-application.dto';
import { UpdateApplicationStatusDto } from '../applications/dto/update-application-status.dto';
import { Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)  // ✅ JwtAuthGuard FIRST
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async createJob(@Body() createJobDto: CreateJobDto, @Request() req: any) {
    try {
      const job = await this.jobService.createJob(createJobDto, req.user);
      return job;
    } catch (error) {
      console.error('JobController - Error creating job:', error);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async updateJob(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @Request() req: any) {
    try {
      const job = await this.jobService.updateJob(id, updateJobDto, req.user);
      return job;
    } catch (error) {
      console.error('JobController - Error updating job:', error);
      throw error;
    }
  }

  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async getJobsByCompany(@Request() req: any, @Query() query: any, @Param('companyId') companyId: string) {
    try {
      // Logic: If companyId is 'all', search by name. Otherwise, filter by specific companyId.
      let finalCompanyId: string | undefined = undefined;
      let finalCompanyName: string | undefined = undefined;
      
      if (companyId === 'all') {
        // Search by company name from query
        finalCompanyName = query.companyName || query.name;
        if (!finalCompanyName) {
          throw new Error('Company name is required when using /all endpoint');
        }
      } else {
        // Filter by specific companyId from path
        finalCompanyId = companyId;
      }
      
      // Build GetJobsDto with proper logic
      const getJobsDto: any = {
        companyId: finalCompanyId,
        companyName: finalCompanyName,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 10,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc'
      };
      
      const result = await this.jobService.getJobsByCompany(getJobsDto);
      return result;
    } catch (error) {
      console.error('JobController - Error getting jobs:', error);
      throw error;
    }
  }

  @Get('company')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async getJobsByCompanyQuery(@Request() req: any, @Query() query: any) {
    try {
      // Handle companyId or companyName from query parameters
      const getJobsDto: any = {
        companyId: query.companyId,
        companyName: query.companyName || query.name,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 10,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc'
      };
      
      const result = await this.jobService.getJobsByCompany(getJobsDto);
      return result;
    } catch (error) {
      console.error('JobController - Error getting jobs:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async deleteJob(@Param('id') id: string, @Request() req: any) {
    try {
      const job = await this.jobService.deleteJob(id, req.user);
      return job;
    } catch (error) {
      console.error('JobController - Error deleting job:', error);
      throw error;
    }
  }

  @Get(':jobId/applications')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async getJobApplications(@Param('jobId') jobId: string, 
  @Request() req: any,
   @Query() query: any) {
    try {
      const result = await this.jobService.getJobApplications(jobId, req.user, query);
      return {
        statusCode: HttpStatus.OK,
        message: 'Applications retrieved successfully',
        data: result
      };
    } catch (error) {
      console.error('JobController - Error getting applications:', error);
      throw error;
    }
  }

  @Post(':jobId/apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)  // Only Users can apply
  @UseInterceptors(FileInterceptor('userCV'))
  async applyToJob(@Param('jobId') jobId: string,
   @Body() applicationData: CreateApplicationDto,
   @Request() req: any,
  @UploadedFile() file: Express.Multer.File,) {
    try {
const result = await this.jobService.applyToJob(jobId, applicationData, req.user, file);
      return {
        statusCode: HttpStatus.OK,
        message: 'Application submitted successfully',
        data: result
      };
    } catch (error) {
      console.error('JobController - Error applying to job:', error);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async getAllJobs(@Request() req: any, @Query() getAllJobsDto: GetAllJobsDto) {
    try {
      const result = await this.jobService.getAllJobs(getAllJobsDto);
      return result;
    } catch (error) {
      console.error('JobController - Error getting all jobs:', error);
      throw error;
    }
  }

  @Patch('applications/:applicationId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async updateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Body() updateApplicationStatusDto: UpdateApplicationStatusDto,
    @Request() req: any
  ) {
    try {
      const result = await this.jobService.updateApplicationStatus(
        applicationId,
        updateApplicationStatusDto.status,
        req.user
      );
      return {
        statusCode: HttpStatus.OK,
        message: `Application ${updateApplicationStatusDto.status} successfully`,
        data: result
      };
    } catch (error) {
      throw error;
    }
  }
}
