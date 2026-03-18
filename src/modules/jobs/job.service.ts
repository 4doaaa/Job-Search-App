import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { GetJobsDto } from './dto/get-jobs.dto';
import { GetAllJobsDto } from './dto/get-all-jobs.dto';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { CreateApplicationDto } from '../applications/dto/create-application.dto';
import { CloudinaryService } from '../companies/services/cloudinary.service';
import { EmailService } from '../companies/services/email.service';

@Injectable()
export class JobService {
 constructor(
  @InjectModel('Job') private jobModel: Model<JobDocument>,
  @InjectModel('Company') private companyModel: Model<CompanyDocument>,
  @InjectModel('Application') private applicationModel: Model<ApplicationDocument>,
  private readonly cloudinaryService: CloudinaryService,
  private readonly emailService: EmailService,
) {}

  private async validateCompanyAccess(companyId: string, user: any): Promise<CompanyDocument> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const isCompanyOwner = company.owner.toString() === user.sub;
    const isAdmin = user.role === 'Admin';

    if (!isCompanyOwner && !isAdmin) {
      throw new ForbiddenException('You can only access your own company resources');
    }

    return company;
  }

  private formatPagination(totalCount: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalCount / limit);
    return {
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      currentPage: page,
      totalPages,
      totalCount
    };
  }

  async createJob(createJobDto: CreateJobDto, user: any): Promise<JobDocument> {
    try {
      await this.validateCompanyAccess(createJobDto.companyId, user);

      const newJob = new this.jobModel({
        ...createJobDto,
        companyId: new Types.ObjectId(createJobDto.companyId),
        addedBy: user.sub,
      });

      const result = await newJob.save();
      return result;
    } catch (error) {
      console.error('JobService - Error creating job:', error);
      throw error;
    }
  }

  async updateJob(jobId: string, updateJobDto: UpdateJobDto, user: any): Promise<JobDocument> {
    try {
      const job = await this.jobModel.findById(jobId);
      if (!job || job.isDeleted) {
        throw new NotFoundException('Job not found');
      }

      await this.validateCompanyAccess(job.companyId, user);

      const updatedJob = await this.jobModel.findByIdAndUpdate(
        jobId,
        { ...updateJobDto },
        { new: true, runValidators: true }
      );

      if (!updatedJob) {
        throw new NotFoundException('Job not found');
      }

      return updatedJob;
    } catch (error) {
      console.error('JobService - Error updating job:', error);
      throw error;
    }
  }

  async deleteJob(jobId: string, user: any): Promise<JobDocument> {
    try {
      const job = await this.jobModel.findById(jobId);
      if (!job || job.isDeleted) {
        throw new NotFoundException('Job not found');
      }

      await this.validateCompanyAccess(job.companyId, user);

      const deletedJob = await this.jobModel.findByIdAndUpdate(
        jobId,
        { isDeleted: true },
        { new: true }
      );

      if (!deletedJob) {
        throw new NotFoundException('Job not found');
      }

      return deletedJob;
    } catch (error) {
      console.error('JobService - Error deleting job:', error);
      throw error;
    }
  }

  async getJobsByCompany(getJobsDto: GetJobsDto): Promise<any> {
    try {
      const query: any = { isDeleted: false };

      if (getJobsDto.companyId) {
        query.companyId = new Types.ObjectId(getJobsDto.companyId);
      }

      if (getJobsDto.companyName) {
        const company = await this.companyModel.findOne({ 
          companyName: { $regex: getJobsDto.companyName, $options: 'i' }
        });
        if (company) {
          query.companyId = company._id;
        } else {
          return {
            jobs: [],
            ...this.formatPagination(0, getJobsDto.page || 1, getJobsDto.limit || 10)
          };
        }
      }

      const page = getJobsDto.page || 1;
      const limit = getJobsDto.limit || 10;
      const skip = (page - 1) * limit;

      const sortBy = getJobsDto.sortBy || 'createdAt';
      const sortOrder = getJobsDto.sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      const totalCount = await this.jobModel.countDocuments(query);

      const jobs = await this.jobModel
        .find(query)
        .populate('companyId')
        .populate('addedBy')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();

      const result = {
        jobs,
        ...this.formatPagination(totalCount, page, limit)
      };

      return result;
    } catch (error) {
      console.error('JobService - Error getting jobs:', error);
      throw error;
    }
  }

  async getAllJobs(getAllJobsDto: GetAllJobsDto): Promise<any> {
    try {
      const query: any = { isDeleted: false };

      if (getAllJobsDto.workingTime) {
        query.workingTime = getAllJobsDto.workingTime;
      }

      if (getAllJobsDto.jobLocation) {
        query.jobLocation = getAllJobsDto.jobLocation;
      }

      if (getAllJobsDto.seniorityLevel) {
        query.seniorityLevel = getAllJobsDto.seniorityLevel;
      }

      if (getAllJobsDto.jobTitle) {
        query.jobTitle = { $regex: getAllJobsDto.jobTitle, $options: 'i' };
      }

      if (getAllJobsDto.technicalSkills && getAllJobsDto.technicalSkills.length > 0) {
        query.technicalSkills = { $in: getAllJobsDto.technicalSkills };
      }

      const page = getAllJobsDto.page || 1;
      const limit = getAllJobsDto.limit || 10;
      const skip = (page - 1) * limit;
      
      const sortBy = getAllJobsDto.sortBy || 'createdAt';
      const sortOrder = getAllJobsDto.sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      const totalCount = await this.jobModel.countDocuments(query);

      const jobs = await this.jobModel
        .find(query)
        .populate('companyId')
        .populate('addedBy')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();

      const result = {
        jobs,
        ...this.formatPagination(totalCount, page, limit)
      };

      return result;
    } catch (error) {
      console.error('JobService - Error getting all jobs:', error);
      throw error;
    }
  }

  async getJobApplications(jobId: string, user: any, query: any): Promise<any> {
    try {
      const job = await this.jobModel.findById(jobId);
      if (!job || job.isDeleted) {
        throw new NotFoundException('Job not found');
      }

      const companyId = (job.companyId as any)._id || job.companyId;
      await this.validateCompanyAccess(companyId, user);

      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 10;
      const skip = (page - 1) * limit;

      const jobWithApplications = await this.jobModel
        .findById(jobId)
        .populate({
          path: 'applications',
          populate: {
            path: 'userId',
            select: 'userName email mobileNumber'
          },
          options: {
            skip: skip,
            limit: limit,
            sort: { createdAt: -1 }
          }
        })
        .exec();

      if (!jobWithApplications) {
        throw new NotFoundException('Job not found');
      }

      const totalApplications = await this.applicationModel
        .countDocuments({ jobId });

      const result = {
        ...(jobWithApplications as any).toObject(),
        applications: {
          data: (jobWithApplications as any).applications,
          pagination: {
            totalCount: totalApplications,
            currentPage: page,
            totalPages: Math.ceil(totalApplications / limit),
            hasNextPage: page < Math.ceil(totalApplications / limit),
            hasPreviousPage: page > 1
          }
        }
      };

      return result;
    } catch (error) {
      console.error('JobService - Error getting job applications:', error);
      throw error;
    }
  }

async applyToJob(jobId: string, applicationData: CreateApplicationDto, user: any, file: Express.Multer.File): Promise<any> {
  try {
    if (user.role !== 'User') throw new ForbiddenException('Only users can apply to jobs');
    
    const job = await this.jobModel.findById(jobId);
    if (!job || job.isDeleted) throw new NotFoundException('Job not found');

    const existingApplication = await this.applicationModel.findOne({ jobId, userId: user.sub });
    if (existingApplication) throw new ForbiddenException('You have already applied to this job');

    if (!file) {
      throw new BadRequestException('Please upload your CV file');
    }
    const cloudinaryResult = await this.cloudinaryService.uploadImage(file, 'job-applications/cvs');

    const newApplication = new this.applicationModel({
      jobId: jobId,
      userId: user.sub,
      userCV: cloudinaryResult.secure_url,
      userSoftSkills: applicationData?.userSoftSkills || []
    });

    const result = await newApplication.save();
    return result;
    
  } catch (error) {
    throw error;
  }
}

async updateApplicationStatus(applicationId: string, status: 'accepted' | 'rejected', user: any): Promise<ApplicationDocument> {
  try {
    const application = await this.applicationModel.findById(applicationId).populate('job');
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const job = await this.jobModel.findById(application.jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const company = await this.companyModel.findById(job.companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const isCompanyOwner = company.owner.toString() === user.sub;
    const isAdmin = user.role === 'Admin';

    if (!isCompanyOwner && !isAdmin) {
      throw new ForbiddenException('You can only update applications for your own company jobs');
    }

    const updatedApplication = await this.applicationModel.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    ).populate('userId').populate('job');

    if (!updatedApplication) {
      throw new NotFoundException('Application not found');
    }

    const applicant = (updatedApplication as any).userId;
    const jobTitle = (updatedApplication as any).job.jobTitle;

    await this.emailService.sendApplicationStatusEmail(
      applicant.email,
      jobTitle,
      status
    );

    return updatedApplication;
  } catch (error) {
    throw error;
  }
}
}