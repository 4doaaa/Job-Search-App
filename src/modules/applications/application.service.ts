import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { User, UserDocument } from '../users/schemas/user.schema/user.schema';
  import * as ExcelJS from 'exceljs'; 

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel('Application') private applicationModel: Model<ApplicationDocument>,
    @InjectModel('Job') private jobModel: Model<JobDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
  ) {}

  async createApplication(createApplicationDto: CreateApplicationDto, user: any): Promise<Application> {
    try {
      console.log('ApplicationService - Creating application for job:', createApplicationDto.jobId, 'by user:', user.sub);
      
      // Verify job exists and is not deleted
      const job = await this.jobModel.findById(createApplicationDto.jobId);
      if (!job || job.isDeleted) {
        throw new NotFoundException('Job not found');
      }

      // Verify user exists
      const userExists = await this.userModel.findById(user.sub);
      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      // Check if user has already applied to this job
      const existingApplication = await this.applicationModel.findOne({
        jobId: createApplicationDto.jobId,
        userId: user.sub,
      });

      if (existingApplication) {
        throw new ForbiddenException('You have already applied to this job');
      }

      // Create new application
      const newApplication = new this.applicationModel({
        ...createApplicationDto,
        userId: user.sub,
      });

      const result = await newApplication.save();
      console.log('ApplicationService - Application created successfully:', result);
      return result;
    } catch (error) {
      console.error('ApplicationService - Error creating application:', error);
      throw error;
    }
  }

  async getApplicationsByJob(jobId: string, user: any): Promise<any> {
    try {
      console.log('ApplicationService - Getting applications for job:', jobId, 'by user:', user.sub);
      
      // Verify job exists
      const job = await this.jobModel.findById(jobId);
      if (!job || job.isDeleted) {
        throw new NotFoundException('Job not found');
      }

      // Check if user is the job creator or Admin
      if (job.addedBy.toString() !== user.sub && user.role !== 'Admin') {
        console.log('ApplicationService - Access denied - Not job creator and not Admin');
        throw new ForbiddenException('You can only view applications for your own jobs');
      }

      // Get applications with populated data
      const applications = await this.applicationModel
        .find({ jobId })
        .populate('userId')
        .populate('jobId')
        .sort({ createdAt: -1 })
        .exec();

      console.log('ApplicationService - Retrieved applications:', applications.length);
      return applications;
    } catch (error) {
      console.error('ApplicationService - Error getting applications:', error);
      throw error;
    }
  }

  async getApplicationsByUser(user: any): Promise<any> {
    try {
      console.log('ApplicationService - Getting applications for user:', user.sub);
      
      // Get user's applications with populated job data
      const applications = await this.applicationModel
        .find({ userId: user.sub })
        .populate('jobId')
        .sort({ createdAt: -1 })
        .exec();

      console.log('ApplicationService - Retrieved user applications:', applications.length);
      return applications;
    } catch (error) {
      console.error('ApplicationService - Error getting user applications:', error);
      throw error;
    }
  }

  async deleteApplication(applicationId: string, user: any): Promise<Application> {
    try {
      console.log('ApplicationService - Deleting application:', applicationId, 'by user:', user.sub);
      
      // Find the application
      const application = await this.applicationModel.findById(applicationId);
      if (!application) {
        throw new NotFoundException('Application not found');
      }

      // Check if user is the application owner or Admin
      if (application.userId.toString() !== user.sub && user.role !== 'Admin') {
        console.log('ApplicationService - Access denied - Not application owner and not Admin');
        throw new ForbiddenException('You can only delete your own applications');
      }

      // Delete the application
      await this.applicationModel.findByIdAndDelete(applicationId);
      console.log('ApplicationService - Application deleted successfully');
      return application;
    } catch (error) {
      console.error('ApplicationService - Error deleting application:', error);
      throw error;
    }
  }
async exportApplicationsToExcel(companyId: string, date: string) {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Applications');

  worksheet.columns = [
    { header: 'User Name', key: 'userName', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Soft Skills', key: 'softSkills', width: 30 },
    { header: 'Job Title', key: 'jobTitle', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Applied At', key: 'appliedAt', width: 20 },
  ];

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const applications: any[] = await this.applicationModel.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })
  .populate('userId')
  .populate({
    path: 'jobId',
    match: { companyId: companyId }
  })
  .exec();

  const filteredApps = applications.filter(app => app.jobId !== null);

  filteredApps.forEach(app => {
    worksheet.addRow({userName: 'Doaa Test',
  email: 'doaa@test.com',
  softSkills: 'Node.js, NestJS',
  jobTitle: 'Backend Developer',
  status: 'pending',
  appliedAt: new Date().toISOString().split('T')[0]});
  });

  return workbook;
}
}
