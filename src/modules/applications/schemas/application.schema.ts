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
export class Application {
  @Prop({ required: true, ref: 'Job' })
  jobId: string;

  @Prop({ required: true, ref: 'User' })
  userId: string;

  @Prop({ required: true })
  userCV: string; // Secure URL for CV

  @Prop({ type: [String], required: true })
  userSoftSkills: string[];

  @Prop({ type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status: string;
}

export type ApplicationDocument = Application & Document;
export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Virtual for populating job
ApplicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for populating user
ApplicationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});
