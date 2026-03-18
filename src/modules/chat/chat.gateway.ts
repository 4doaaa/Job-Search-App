import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

interface MessagePayload {
  receiverId: string;
  content: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Check for token in multiple places
      let token = client.handshake.auth.token || 
                  client.handshake.headers.token || 
                  client.handshake.query.token;
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Remove 'Bearer ' prefix if present
      if (token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      this.connectedUsers.set(client.id, userId);
      client.join(userId); // Join user to their own room
      
      // Notify others that user is online
      client.broadcast.emit('userOnline', { userId });
      
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.server.emit('userOffline', { userId });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessagePayload,
  ) {
    try {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) {
        throw new UnauthorizedException('User not authenticated');
      }

      const { receiverId, content } = payload;

      // Validate message content
      if (!content || content.trim().length === 0) {
        throw new ForbiddenException('Message content cannot be empty');
      }

      if (content.length > 1000) {
        throw new ForbiddenException('Message content too long');
      }

      // Check if user can send message (conversation start validation)
      const canSend = await this.chatService.canSendMessage(senderId, receiverId);
      if (!canSend) {
        throw new ForbiddenException('You cannot start a conversation with this user');
      }

      // Save message to database
      const message = await this.chatService.saveMessage(senderId, receiverId, content);

      // Get populated message
      const populatedMessage = await this.chatService.getChatHistory(senderId, receiverId);
      const latestMessage = populatedMessage[populatedMessage.length - 1];

      // Send message to receiver if they're online
      const receiverSocketId = Array.from(this.connectedUsers.entries())
        .find(([_, userId]) => userId === receiverId)?.[0];

      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('newMessage', latestMessage);
      }

      // Send confirmation to sender
      client.emit('messageSent', latestMessage);

      return latestMessage;

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { otherUserId: string },
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      await this.chatService.markMessagesAsRead(userId, payload.otherUserId);
      
      // Notify the other user that messages were read
      const otherUserSocketId = Array.from(this.connectedUsers.entries())
        .find(([_, userId]) => userId === payload.otherUserId)?.[0];

      if (otherUserSocketId) {
        this.server.to(otherUserSocketId).emit('messagesRead', { userId });
      }

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = Array.from(this.connectedUsers.values());
    client.emit('onlineUsers', onlineUsers);
  }
}
