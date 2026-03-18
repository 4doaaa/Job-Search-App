import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
})
export class Message {
  @Prop({ required: true, ref: 'User' })
  senderId: string;

  @Prop({ required: true, ref: 'User' })
  receiverId: string;

  @Prop({ required: true, maxlength: 1000 })
  content: string;

  @Prop({ default: false })
  isRead: boolean;
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);

// Virtual for populating sender
MessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for populating receiver
MessageSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receiverId',
  foreignField: '_id',
  justOne: true,
});

// Index for efficient chat history queries
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });
