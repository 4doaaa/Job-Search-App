import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument, Role } from '../users/schemas/user.schema/user.schema';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private messageModel: Model<MessageDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Company') private companyModel: Model<CompanyDocument>,
  ) {}

  async getChatHistory(currentUserId: string, otherUserId: string): Promise<MessageDocument[]> {
    const messages = await this.messageModel
      .find({
        $or: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      })
      .populate('sender', 'userName email')
      .populate('receiver', 'userName email')
      .sort({ createdAt: 1 })
      .exec();

    return messages;
  }

  async canSendMessage(senderId: string, receiverId: string): Promise<boolean> {
    const sender = await this.userModel.findById(senderId);
    const receiver = await this.userModel.findById(receiverId);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if sender is a company owner (has a company)
    const senderCompany = await this.companyModel.findOne({ owner: senderId });
    
    // If sender is Admin or Company Owner, they can always start conversation
    if (sender.role === Role.ADMIN || senderCompany) {
      return true;
    }

    // If sender is regular user, check if conversation already exists
    const existingMessage = await this.messageModel.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    return !!existingMessage;
  }

  async saveMessage(senderId: string, receiverId: string, content: string): Promise<MessageDocument> {
    const message = new this.messageModel({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      content,
    });

    return message.save();
  }

  async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      { isRead: true }
    );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      receiverId: userId,
      isRead: false,
    });
  }
}
