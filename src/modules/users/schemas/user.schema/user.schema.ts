import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum Role {
  USER = 'User',
  ADMIN = 'Admin',
}

export enum OTPType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

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
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    required: true,
    trim: true,
  })
  mobileNumber: string;

  @Prop({
    type: String,
    enum: Object.values(Gender),
    required: true,
  })
  gender: Gender;

  @Prop({
    type: Date,
    required: true,
    validate: {
      validator: function (value: Date) {
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1 > 18;
        }
        
        return age > 18 && birthDate < today;
      },
      message: 'User must be older than 18 years and birth date must be in the past',
    },
  })
  DOB: Date;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.USER,
  })
  role: Role;

  @Prop([
    {
      code: { type: String, required: true },
      type: { type: String, enum: Object.values(OTPType), required: true },
      expiresIn: { type: Date, required: true },
    },
  ])
  OTP: Array<{
    code: string;
    type: OTPType;
    expiresIn: Date;
  }>;

  @Prop({
    type: { secure_url: String, public_id: String },
  })
  profilePic: {
    secure_url?: string;
    public_id?: string;
  };

  @Prop({
    type: { secure_url: String, public_id: String },
  })
  coverPic: {
    secure_url?: string;
    public_id?: string;
  };

  @Prop({
    type: Boolean,
    default: false,
  })
  isConfirmed: boolean;

  @Prop({ type: Date })
  bannedAt: Date;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Date })
  changeCredentialTime: Date;
}

export type UserDocument = User & Document;

const UserSchema = SchemaFactory.createForClass(User);

// Pre-save middleware to hash password and encrypt mobile number
UserSchema.pre('save', async function () {
  const user = this as any;

  // Hash password if it's modified
  if (user.isModified('password')) {
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
    
    // Update changeCredentialTime when password changes
    user.changeCredentialTime = new Date();
  }

  // Encrypt mobile number if it's modified
  if (user.isModified('mobileNumber')) {
    const algorithm = 'aes-256-cbc';
    const encryptionKey = process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwxyz123456'; // 32 chars
    const iv = crypto.randomBytes(16); // 16 bytes for IV
    
    const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
    let encrypted = cipher.update(user.mobileNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    user.mobileNumber = iv.toString('hex') + ':' + encrypted;
  }
});

// Virtual for username (firstName + lastName)
UserSchema.virtual('username').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes for better performance
UserSchema.index({ role: 1 });
UserSchema.index({ isConfirmed: 1 });
UserSchema.index({ bannedAt: 1 });
UserSchema.index({ deletedAt: 1 });

// Pre-find middleware to handle soft deletes
UserSchema.pre(/^find/, function () {
  (this as any).find({ deletedAt: { $exists: false } });
});

// Post-find middleware to decrypt mobile number
UserSchema.post(/^find/, function(docs) {
  // Handle null/undefined results
  if (!docs) return;
  
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc && doc.mobileNumber && doc.mobileNumber.includes(':')) {
        const parts = doc.mobileNumber.split(':');
        if (parts.length === 2) {
          const iv = Buffer.from(parts[0], 'hex');
          const encrypted = parts[1];
          const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwxyz123456', iv);
          let decrypted = decipher.update(encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          doc.mobileNumber = decrypted;
        }
      }
    });
  } else if (docs.mobileNumber && docs.mobileNumber.includes(':')) {
    const parts = docs.mobileNumber.split(':');
    if (parts.length === 2) {
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwxyz123456', iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      docs.mobileNumber = decrypted;
    }
  }
});

export { UserSchema };
