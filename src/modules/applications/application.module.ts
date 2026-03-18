import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ApplicationSchema } from './schemas/application.schema';
import { JobSchema } from '../jobs/schemas/job.schema'; 
import { UserSchema } from '../users/schemas/user.schema/user.schema'; 
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Application', schema: ApplicationSchema },
      { name: 'Job', schema: JobSchema }, 
      { name: 'User', schema: UserSchema }, 
    ]),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService], 
})
export class ApplicationModule {}