import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST') || 'smtp.gmail.com',
      port: this.configService.get('EMAIL_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendApplicationStatusEmail(
    to: string,
    jobTitle: string,
    status: 'accepted' | 'rejected',
  ): Promise<void> {
    const subject = status === 'accepted' 
      ? `Congratulations! Your application for ${jobTitle}` 
      : `Update on your application for ${jobTitle}`;

    const text = status === 'accepted'
      ? `Congratulations! Your application for ${jobTitle} has been accepted.`
      : `We regret to inform you that your application for ${jobTitle} was not successful.`;

    const html = status === 'accepted'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Congratulations! </h2>
          <p>Dear Applicant,</p>
          <p>We are pleased to inform you that your application for the position of <strong>${jobTitle}</strong> has been <strong>accepted</strong>.</p>
          <p>The hiring team will contact you soon with the next steps.</p>
          <p>Best regards,<br>HR Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Application Update</h2>
          <p>Dear Applicant,</p>
          <p>We regret to inform you that your application for the position of <strong>${jobTitle}</strong> was not successful at this time.</p>
          <p>We appreciate your interest in our company and wish you the best in your job search.</p>
          <p>Best regards,<br>HR Team</p>
        </div>
      `;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM') || this.configService.get('EMAIL_USER'),
      to,
      subject,
      text,
      html,
    });
  }
}
