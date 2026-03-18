import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanySchema } from './schemas/company.schema';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CloudinaryService } from './services/cloudinary.service';
import { EmailService } from './services/email.service';
import { OwnershipGuard } from './guards/ownership.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Company', schema: CompanySchema },
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService, CloudinaryService, EmailService, OwnershipGuard],
  exports: [CompanyService, CloudinaryService, EmailService],
})
export class CompaniesModule {}
