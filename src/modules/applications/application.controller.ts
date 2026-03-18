import { Controller, Post, Get, Delete, HttpStatus, Request, UseGuards, Param, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema/user.schema';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Body } from '@nestjs/common';
import express from 'express';

@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  
  async createApplication(@Body() createApplicationDto: CreateApplicationDto, @Request() req: any) {
    try {
      console.log('ApplicationController - Starting createApplication method');
      console.log('ApplicationController - Creating application for job:', createApplicationDto.jobId, 'by user:', req.user.sub);
      const application = await this.applicationService.createApplication(createApplicationDto, req.user);
      console.log('ApplicationController - Application created successfully, returning result');
      console.log('ApplicationController - Returning application object:', application);
      return application;
    } catch (error) {
      console.error('ApplicationController - Error creating application:', error);
      throw error;
    }
  }

@Get('excel/:companyId/:date')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN) 
async downloadExcel(
  @Param('companyId') companyId: string,
  @Param('date') date: string,
  @Res() res: express.Response
) {
  const workbook = await this.applicationService.exportApplicationsToExcel(companyId, date);
  
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=applications-${date}.xlsx`,
  );

  await workbook.xlsx.write(res);
  res.end();
}

  @Get('job/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (HR) or Admin
  async getApplicationsByJob(@Param('jobId') jobId: string, @Request() req: any) {
    try {
      console.log('ApplicationController - Starting getApplicationsByJob method');
      console.log('ApplicationController - Getting applications for job:', jobId, 'by user:', req.user.sub);
      const applications = await this.applicationService.getApplicationsByJob(jobId, req.user);
      console.log('ApplicationController - Applications retrieved successfully, returning result');
      console.log('ApplicationController - Returning applications array:', applications);
      return applications;
    } catch (error) {
      console.error('ApplicationController - Error getting applications:', error);
      throw error;
    }
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (Job Seeker) or Admin
  async getApplicationsByUser(@Request() req: any) {
    try {
      console.log('ApplicationController - Starting getApplicationsByUser method');
      console.log('ApplicationController - Getting applications for user:', req.user.sub);
      const applications = await this.applicationService.getApplicationsByUser(req.user);
      console.log('ApplicationController - User applications retrieved successfully, returning result');
      console.log('ApplicationController - Returning user applications array:', applications);
      return applications;
    } catch (error) {
      console.error('ApplicationController - Error getting user applications:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)  // Allow User (Job Seeker) or Admin
  async deleteApplication(@Param('id') id: string, @Request() req: any) {
    try {
      console.log('ApplicationController - Starting deleteApplication method');
      console.log('ApplicationController - Deleting application:', id, 'by user:', req.user.sub);
      const application = await this.applicationService.deleteApplication(id, req.user);
      console.log('ApplicationController - Application deleted successfully, returning result');
      console.log('ApplicationController - Returning deleted application object:', application);
      return application;
    } catch (error) {
      console.error('ApplicationController - Error deleting application:', error);
      throw error;
    }
  }


}
