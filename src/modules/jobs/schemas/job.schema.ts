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
export class Job {
  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true })
  jobLocation: string;

  @Prop({ required: true })
  workingTime: string;

  @Prop({ required: true })
  seniorityLevel: string;

  @Prop({ required: true })
  jobDescription: string;

  @Prop({ type: [String], required: true })
  technicalSkills: string[];

  @Prop({ type: [String], required: true })
  softSkills: string[];

  @Prop({ required: true, ref: 'User' })
  addedBy: string;

  @Prop({ required: true, ref: 'Company' })
  companyId: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export type JobDocument = Job & Document;
export const JobSchema = SchemaFactory.createForClass(Job);

// Virtual for populating company
JobSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for populating addedBy user
JobSchema.virtual('user', {
  ref: 'User',
  localField: 'addedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for populating applications
JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId',
});
