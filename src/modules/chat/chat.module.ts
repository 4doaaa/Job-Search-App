import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MessageSchema } from './schemas/message.schema';
import { UserSchema } from '../users/schemas/user.schema/user.schema';
import { CompanySchema } from '../companies/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Company', schema: CompanySchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-32-chars-long',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
