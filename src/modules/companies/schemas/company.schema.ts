import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

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
export class Company {
  @Prop({ required: true, unique: true })
  companyName: string;

  @Prop({ required: true, unique: true })
  companyEmail: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  website: string;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true })
  location: string;

  @Prop({ type: Boolean, default: false })
  isApproved: boolean;

  @Prop({ type: Boolean, default: false })
  isBanned: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({
    type: { secure_url: String, public_id: String },
  })
  logo?: {
    secure_url?: string;
    public_id?: string;
  };

  @Prop({
    type: { secure_url: String, public_id: String },
  })
  coverImage?: {
    secure_url?: string;
    public_id?: string;
  };

  @Prop({
    type: { secure_url: String, public_id: String },
  })
  coverPic?: {
    secure_url?: string;
    public_id?: string;
  };

  @Prop({ required: true, ref: 'User' })
  owner: string;
}

export type CompanyDocument = Company & Document;

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company'
});

// في آخر ملف company.schema.ts
CompanySchema.pre('findOneAndDelete', async function() {
  try {
    const companyId = this.getQuery()._id;
    console.log('Hook: Deleting related jobs for company:', companyId);

    // الطريقة دي أضمن للوصول للموديلات التانية في NestJS
    const JobModel = new this.model('Job'); 
    
    // امسحي الـ Jobs اللي مرتبطة بالشركة دي
    const result = await JobModel.deleteMany({ addedBy: companyId });
    
    console.log(`Hook: Success - Deleted ${result.deletedCount} related jobs.`);
  } catch (error) {
    console.error('Hook Error:', error);
    // مش بنرمي Error هنا عشان عملية مسح الشركة نفسها تكمل لو فيه مشكلة في مسح الـ Jobs
  }
});