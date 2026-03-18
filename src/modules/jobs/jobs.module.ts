import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobSchema } from './schemas/job.schema';
import { CompanySchema } from '../companies/schemas/company.schema';
import { ApplicationSchema } from '../applications/schemas/application.schema';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    CompaniesModule,
    MongooseModule.forFeature([
      { name: 'Job', schema: JobSchema },
      { name: 'Company', schema: CompanySchema },
      { name: 'Application', schema: ApplicationSchema },
    ]),
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService, MongooseModule],
})
export class JobsModule {}
