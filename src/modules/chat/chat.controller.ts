import { Controller, Get, Param, Request, UseGuards, HttpStatus, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':userId')
  async getChatHistory(@Param('userId') otherUserId: string, @Request() req: any) {
    try {
      const currentUserId = req.user.sub;
      const messages = await this.chatService.getChatHistory(currentUserId, otherUserId);
      
      // Mark messages as read
      await this.chatService.markMessagesAsRead(currentUserId, otherUserId);
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Chat history retrieved successfully',
        data: messages,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('unread/count')
  async getUnreadMessageCount(@Request() req: any) {
    try {
      const currentUserId = req.user.sub;
      const unreadCount = await this.chatService.getUnreadMessageCount(currentUserId);
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Unread message count retrieved successfully',
        data: { unreadCount },
      };
    } catch (error) {
      throw error;
    }
  }
}
