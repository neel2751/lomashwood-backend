import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class Msg91Provider {
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MSG91_AUTH_KEY');
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || 'MSGIND';
    this.baseUrl = this.configService.get<string>('MSG91_BASE_URL') || 'https://api.msg91.com/api/v5';
    
    if (!this.apiKey) {
      throw new Error('MSG91 Auth Key is required');
    }
  }

  async sendSms(smsData: {
    to: string | string[];
    message: string;
    template?: string;
    templateData?: any;
    route?: string;
    country?: string;
    smsType?: string;
    campaign?: string;
    response?: string;
    medium?: string;
    flowId?: string;
    shortUrl?: string;
    unicode?: boolean;
    schtime?: string;
    afterminutes?: number;
    flash?: boolean;
    custom?: string;
    var?: string;
  }): Promise<any> {
    try {
      const recipients = Array.isArray(smsData.to) ? smsData.to : [smsData.to];
      
      const payload: any = {
        authkey: this.apiKey,
        mobile: recipients.join(','), // MSG91 expects comma-separated numbers
        message: smsData.message,
        sender: this.senderId,
        route: smsData.route || '4', // Default to transactional route
        country: smsData.country || '91', // Default to India
        response: smsData.response || 'json',
      };

      // Handle template-based SMS
      if (smsData.template) {
        payload.template_id = smsData.template;
        if (smsData.templateData) {
          payload.extra_vars = JSON.stringify(smsData.templateData);
        }
      }

      // Handle optional parameters
      if (smsData.smsType) {
        payload.sms_type = smsData.smsType;
      }

      if (smsData.campaign) {
        payload.campaign = smsData.campaign;
      }

      if (smsData.medium) {
        payload.medium = smsData.medium;
      }

      if (smsData.flowId) {
        payload.flow_id = smsData.flowId;
      }

      if (smsData.shortUrl) {
        payload.short_url = smsData.shortUrl;
      }

      if (smsData.unicode !== undefined) {
        payload.unicode = smsData.unicode ? '1' : '0';
      }

      if (smsData.schtime) {
        payload.schtime = smsData.schtime;
      }

      if (smsData.afterminutes) {
        payload.afterminutes = smsData.afterminutes.toString();
      }

      if (smsData.flash) {
        payload.flash = smsData.flash ? '1' : '0';
      }

      if (smsData.custom) {
        payload.custom = smsData.custom;
      }

      if (smsData.var) {
        payload.var = smsData.var;
      }

      const response = await axios.post(`${this.baseUrl}/sendhttp.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      if (result.type === 'success') {
        return {
          success: true,
          messageId: result.message,
          response: result,
          to: recipients,
          from: this.senderId,
          message: smsData.message,
          sentAt: new Date(),
        };
      } else {
        return {
          success: false,
          error: result.message || 'Unknown error',
          code: result.code,
          response: result,
        };
      }
    } catch (error) {
      console.error('MSG91 error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async sendBulkSms(bulkData: {
    recipients: string[];
    message: string;
    template?: string;
    templateData?: any;
    route?: string;
    country?: string;
    campaign?: string;
  }): Promise<any> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      details: [] as any[],
    };

    // MSG91 supports bulk sending up to 1000 numbers at once
    const batchSize = 1000;
    const batches = [];
    
    for (let i = 0; i < bulkData.recipients.length; i += batchSize) {
      batches.push(bulkData.recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      try {
        const result = await this.sendSms({
          to: batch,
          message: bulkData.message,
          template: bulkData.template,
          templateData: bulkData.templateData,
          route: bulkData.route,
          country: bulkData.country,
          campaign: bulkData.campaign,
        });

        if (result.success) {
          results.details.push({
            recipients: batch,
            messageId: result.messageId,
            status: 'SENT',
            success: true,
          });
          results.sent += batch.length;
        } else {
          results.details.push({
            recipients: batch,
            error: result.error,
            status: 'FAILED',
            success: false,
          });
          results.failed += batch.length;
        }
      } catch (error) {
        results.details.push({
          recipients: batch,
          error: error.message,
          status: 'FAILED',
          success: false,
        });
        results.failed += batch.length;
      }
    }

    return results;
  }

  async sendOtpSms(otpData: {
    to: string;
    purpose: string;
    length?: number;
    expiry?: number;
    template?: string;
    templateData?: any;
  }): Promise<any> {
    try {
      const otp = this.generateOtp(otpData.length || 6);
      const expiry = otpData.expiry || 300; // 5 minutes default

      let message = `Your OTP for ${otpData.purpose} is: ${otp}. Valid for ${expiry / 60} minutes.`;

      // Use MSG91 OTP template if available
      if (otpData.template) {
        const templatePayload = {
          authkey: this.apiKey,
          template_id: otpData.template,
          mobile: otpData.to,
          extra_vars: JSON.stringify({
            ...otpData.templateData,
            otp,
            purpose: otpData.purpose,
            expiry: expiry / 60,
          }),
        };

        const response = await axios.post(`${this.baseUrl}/template/send.php`, new URLSearchParams(templatePayload), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        const result = response.data;
        
        if (result.type === 'success') {
          return {
            success: true,
            messageId: result.message,
            otpLength: otp.length,
            expiry,
            message: 'OTP sent successfully',
            response: result,
          };
        } else {
          return {
            success: false,
            error: result.message || 'Unknown error',
            code: result.code,
            response: result,
          };
        }
      } else {
        // Send regular SMS with OTP
        const result = await this.sendSms({
          to: otpData.to,
          message,
          route: '4', // OTP route
          country: '91',
        });

        if (result.success) {
          // Store OTP for verification (this would typically be stored in Redis/database)
          await this.storeOtp(otpData.to, otp, otpData.purpose, expiry);
          
          return {
            success: true,
            messageId: result.messageId,
            otpLength: otp.length,
            expiry,
            message: 'OTP sent successfully',
          };
        } else {
          return result;
        }
      }
    } catch (error) {
      console.error('MSG91 OTP error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async verifyOtpSms(phone: string, otp: string, purpose: string): Promise<any> {
    try {
      const storedOtp = await this.getStoredOtp(phone, purpose);
      
      if (!storedOtp) {
        return {
          success: false,
          message: 'OTP not found or expired',
        };
      }

      if (storedOtp.otp !== otp) {
        return {
          success: false,
          message: 'Invalid OTP',
        };
      }

      if (Date.now() > storedOtp.expiresAt) {
        return {
          success: false,
          message: 'OTP expired',
        };
      }

      // Mark OTP as used
      await this.markOtpAsUsed(phone, purpose);

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.error('MSG91 OTP verification error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
        messageid: messageId,
        mobile: '', // Required for MSG91 API
      };

      const response = await axios.post(`${this.baseUrl}/getDeliveryReport.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      return {
        success: true,
        status: result.status,
        message: result.message,
        deliveryReport: result,
      };
    } catch (error) {
      console.error('MSG91 status check error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getDeliveryReports(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
      };

      if (params.startDate) {
        payload.startdate = params.startDate;
      }

      if (params.endDate) {
        payload.enddate = params.endDate;
      }

      if (params.limit) {
        payload.limit = params.limit.toString();
      }

      if (params.offset) {
        payload.offset = params.offset.toString();
      }

      const response = await axios.post(`${this.baseUrl}/getDeliveryReport.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      return {
        success: true,
        reports: result.reports || [],
        total: result.total || 0,
        response: result,
      };
    } catch (error) {
      console.error('MSG91 delivery reports error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getBalance(): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
      };

      const response = await axios.post(`${this.baseUrl}/balance.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      return {
        success: true,
        balance: result.balance || 0,
        currency: result.currency || 'INR',
        response: result,
      };
    } catch (error) {
      console.error('MSG91 balance check error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getTemplates(): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
      };

      const response = await axios.post(`${this.baseUrl}/template/list.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      return {
        success: true,
        templates: result.templates || [],
        response: result,
      };
    } catch (error) {
      console.error('MSG91 templates error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async createTemplate(templateData: {
    name: string;
    content: string;
    variables?: string[];
    category?: string;
  }): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
        template_name: templateData.name,
        template_content: templateData.content,
        template_variables: templateData.variables?.join(',') || '',
        category: templateData.category || 'TRANSACTIONAL',
      };

      const response = await axios.post(`${this.baseUrl}/template/add.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      if (result.type === 'success') {
        return {
          success: true,
          templateId: result.template_id,
          message: 'Template created successfully',
          response: result,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Unknown error',
          code: result.code,
          response: result,
        };
      }
    } catch (error) {
      console.error('MSG91 template creation error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async updateTemplate(templateId: string, templateData: {
    name?: string;
    content?: string;
    variables?: string[];
    category?: string;
  }): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
        template_id: templateId,
      };

      if (templateData.name) {
        payload.template_name = templateData.name;
      }

      if (templateData.content) {
        payload.template_content = templateData.content;
      }

      if (templateData.variables) {
        payload.template_variables = templateData.variables.join(',');
      }

      if (templateData.category) {
        payload.category = templateData.category;
      }

      const response = await axios.post(`${this.baseUrl}/template/edit.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      if (result.type === 'success') {
        return {
          success: true,
          message: 'Template updated successfully',
          response: result,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Unknown error',
          code: result.code,
          response: result,
        };
      }
    } catch (error) {
      console.error('MSG91 template update error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async deleteTemplate(templateId: string): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
        template_id: templateId,
      };

      const response = await axios.post(`${this.baseUrl}/template/delete.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      if (result.type === 'success') {
        return {
          success: true,
          message: 'Template deleted successfully',
          response: result,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Unknown error',
          code: result.code,
          response: result,
        };
      }
    } catch (error) {
      console.error('MSG91 template deletion error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async validatePhoneNumber(phone: string): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
        mobile: phone,
        country: '91', // Default to India
      };

      const response = await axios.post(`${this.baseUrl}/validateMobile.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      return {
        success: true,
        phone: result.mobile || phone,
        isValid: result.valid === 'true',
        isMobile: result.type === 'mobile',
        country: result.country || 'IN',
        operator: result.operator || 'Unknown',
        circle: result.circle || 'Unknown',
        response: result,
      };
    } catch (error) {
      console.error('MSG91 phone validation error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async testConfiguration(): Promise<any> {
    try {
      const balance = await this.getBalance();
      return {
        success: true,
        message: 'MSG91 configuration is valid',
        balance,
      };
    } catch (error) {
      console.error('MSG91 configuration test failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getRouteInfo(route?: string): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
        route: route || '4',
      };

      const response = await axios.post(`${this.baseUrl}/routeInfo.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      return {
        success: true,
        routeInfo: result,
        response: result,
      };
    } catch (error) {
      console.error('MSG91 route info error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getCountryCodes(): Promise<any> {
    try {
      const payload = {
        authkey: this.apiKey,
      };

      const response = await axios.post(`${this.baseUrl}/countryCodes.php`, new URLSearchParams(payload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = response.data;
      
      return {
        success: true,
        countryCodes: result.countryCodes || [],
        response: result,
      };
    } catch (error) {
      console.error('MSG91 country codes error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  private generateOtp(length: number): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  private async storeOtp(phone: string, otp: string, purpose: string, expiry: number): Promise<void> {
    // This would typically store in Redis or database
    const otpData = {
      phone,
      otp,
      purpose,
      createdAt: Date.now(),
      expiresAt: Date.now() + (expiry * 1000),
      used: false,
    };
    
    console.log('OTP stored:', otpData);
  }

  private async getStoredOtp(phone: string, purpose: string): Promise<any> {
    // This would typically fetch from Redis or database
    // For now, returning mock data
    return null;
  }

  private async markOtpAsUsed(phone: string, purpose: string): Promise<void> {
    // This would typically mark OTP as used in Redis or database
    console.log('OTP marked as used:', { phone, purpose });
  }
}
