import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../users/schemas/user.schema/user.schema';
import { CompanySchema } from '../companies/schemas/company.schema';
import { AdminService } from './admin.service';
import { AdminResolver } from './graphql/admin.resolver';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Company', schema: CompanySchema },
    ]),
    AuthModule,
  ],
  providers: [AdminService, AdminResolver],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
