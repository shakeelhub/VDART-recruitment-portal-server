import nodemailer from 'nodemailer';
import { generateDeploymentEmailTemplate } from '../utils/deploymentEmailTemplate.js';
import { generateInternalTransferEmailTemplate } from '../utils/internalTransferEmailTemplate.js';
import Employee from '../schema/Employee.js';

class EmailService {
  
  async createDynamicTransporter() {
    try {
      const manager = await Employee.findOne({
        team: 'Delivery',
        isDeliveryManager: true,
        isActive: true,
        canSendEmail: true
      }).select('managerEmailConfig name');

      if (!manager || !manager.managerEmailConfig) {
        throw new Error('No active delivery manager found with email permissions');
      }

      const { email, appPassword } = manager.managerEmailConfig;

      if (!email || !appPassword) {
        throw new Error('Manager email credentials are incomplete');
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: email,
          pass: appPassword
        },
        tls: { rejectUnauthorized: false }
      });

      await transporter.verify();
      
      return {
        transporter,
        managerInfo: {
          email,
          name: manager.name
        }
      };

    } catch (error) {
      console.error('❌ Dynamic transporter creation failed:', error.message);
      throw new Error(`Email configuration error: ${error.message}`);
    }
  }

  async sendDeploymentEmail(formData, recipientEmails, ccEmails = [], subject = '', content = '', senderEmpId) {
    try {
      const sender = await Employee.findOne({
        empId: senderEmpId,
        team: 'Delivery',
        isActive: true,
        canSendEmail: true
      });

      if (!sender) {
        throw new Error('Sender does not have email permissions or is not active');
      }

      const { transporter, managerInfo } = await this.createDynamicTransporter();
      
      // Generate email template with Client and BU fields
      const html = generateDeploymentEmailTemplate(formData, content);
      
      const emailPromises = recipientEmails.map(async (email) => {
        const mailOptions = {
          from: `${managerInfo.name} - Delivery Department <${managerInfo.email}>`,
          to: email.trim(),
          subject: subject.trim() || 'Employee Deployment Notice',
          html: html
        };

        if (ccEmails && ccEmails.length > 0) {
          const validCcEmails = ccEmails.filter(cc => cc && cc.trim());
          if (validCcEmails.length > 0) {
            mailOptions.cc = validCcEmails.join(', ');
          }
        }

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email} from ${managerInfo.email}:`, result.messageId);
        return { email, success: true, messageId: result.messageId };
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: 'Deployment email sent successfully',
        data: {
          total: recipientEmails.length,
          successful,
          failed,
          sentFrom: managerInfo.email,
          senderName: managerInfo.name,
          results: results.map(r => ({
            success: r.status === 'fulfilled',
            data: r.value || null,
            error: r.reason || null
          }))
        }
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // NEW METHOD: Send Internal Transfer Email
  async sendInternalTransferEmail(formData, recipientEmails, ccEmails = [], subject = '', content = '', senderEmpId) {
    try {
      const sender = await Employee.findOne({
        empId: senderEmpId,
        team: 'Delivery',
        isActive: true,
        canSendEmail: true
      });

      if (!sender) {
        throw new Error('Sender does not have email permissions or is not active');
      }

      const { transporter, managerInfo } = await this.createDynamicTransporter();
      
      // Generate internal transfer email template
      const html = generateInternalTransferEmailTemplate(formData, content);
      
      const emailPromises = recipientEmails.map(async (email) => {
        const mailOptions = {
          from: `${managerInfo.name} - Delivery Department <${managerInfo.email}>`,
          to: email.trim(),
          subject: subject.trim() || 'Internal Transfer Notice',
          html: html
        };

        if (ccEmails && ccEmails.length > 0) {
          const validCcEmails = ccEmails.filter(cc => cc && cc.trim());
          if (validCcEmails.length > 0) {
            mailOptions.cc = validCcEmails.join(', ');
          }
        }

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Transfer email sent to ${email} from ${managerInfo.email}:`, result.messageId);
        return { email, success: true, messageId: result.messageId };
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: 'Internal transfer email sent successfully',
        data: {
          total: recipientEmails.length,
          successful,
          failed,
          sentFrom: managerInfo.email,
          senderName: managerInfo.name,
          results: results.map(r => ({
            success: r.status === 'fulfilled',
            data: r.value || null,
            error: r.reason || null
          }))
        }
      };
    } catch (error) {
      console.error('❌ Transfer email sending failed:', error);
      throw new Error(`Transfer email sending failed: ${error.message}`);
    }
  }

  async testEmailConfig() {
    try {
      const { transporter, managerInfo } = await this.createDynamicTransporter();
      console.log(`✅ Email config valid for ${managerInfo.email}`);
      return {
        success: true,
        message: `Email configuration valid for ${managerInfo.name} (${managerInfo.email})`
      };
    } catch (error) {
      console.error('❌ Email config test failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

const emailService = new EmailService();
export default emailService;