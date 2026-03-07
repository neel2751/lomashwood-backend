import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioProvider {
  private readonly client: twilio.Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio Account SID and Auth Token are required');
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSms(smsData: {
    to: string;
    body: string;
    from?: string;
    mediaUrl?: string[];
    statusCallback?: string;
    validityPeriod?: number;
    maxPrice?: number;
    applicationSid?: string;
    maxRetries?: number;
    scheduleType?: string;
    sendAt?: Date;
    priority?: string;
    smartEncoded?: boolean;
    forceDelivery?: boolean;
    contentRetention?: number;
    shortenUrls?: boolean;
    scheduleType?: string;
    deliveryCallback?: string;
    readCallback?: string;
  }): Promise<any> {
    try {
      const fromNumber = smsData.from || this.configService.get<string>('TWILIO_FROM_NUMBER');
      
      const messageOptions: twilio.MessageListInstanceCreateOptions = {
        to: smsData.to,
        body: smsData.body,
        from: fromNumber,
      };

      // Handle optional parameters
      if (smsData.mediaUrl && smsData.mediaUrl.length > 0) {
        messageOptions.mediaUrl = smsData.mediaUrl;
      }

      if (smsData.statusCallback) {
        messageOptions.statusCallback = smsData.statusCallback;
      }

      if (smsData.validityPeriod) {
        messageOptions.validityPeriod = smsData.validityPeriod;
      }

      if (smsData.maxPrice) {
        messageOptions.maxPrice = smsData.maxPrice;
      }

      if (smsData.applicationSid) {
        messageOptions.applicationSid = smsData.applicationSid;
      }

      if (smsData.maxRetries) {
        messageOptions.maxRetries = smsData.maxRetries;
      }

      if (smsData.scheduleType) {
        messageOptions.scheduleType = smsData.scheduleType as any;
      }

      if (smsData.sendAt) {
        messageOptions.sendAt = smsData.sendAt;
      }

      if (smsData.priority) {
        messageOptions.priority = smsData.priority as any;
      }

      if (smsData.smartEncoded !== undefined) {
        messageOptions.smartEncoded = smsData.smartEncoded;
      }

      if (smsData.forceDelivery !== undefined) {
        messageOptions.forceDelivery = smsData.forceDelivery;
      }

      if (smsData.contentRetention) {
        messageOptions.contentRetention = smsData.contentRetention;
      }

      if (smsData.shortenUrls !== undefined) {
        messageOptions.shortenUrls = smsData.shortenUrls;
      }

      if (smsData.deliveryCallback) {
        messageOptions.deliveryCallback = smsData.deliveryCallback;
      }

      if (smsData.readCallback) {
        messageOptions.readCallback = smsData.readCallback;
      }

      const message = await this.client.messages.create(messageOptions);
      
      return {
        success: true,
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        uri: message.uri,
        accountSid: message.accountSid,
        numSegments: message.numSegments,
        numMedia: message.numMedia,
        price: message.price,
        priceUnit: message.priceUnit,
        apiVersion: message.apiVersion,
        subresourceUris: message.subresourceUris,
      };
    } catch (error) {
      console.error('Twilio error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
        moreInfo: error.moreInfo,
        status: error.status,
      };
    }
  }

  async sendBulkSms(bulkData: {
    recipients: string[];
    body: string;
    from?: string;
    mediaUrl?: string[];
    statusCallback?: string;
  }): Promise<any> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      details: [] as any[],
    };

    const fromNumber = bulkData.from || this.configService.get<string>('TWILIO_FROM_NUMBER');

    for (const recipient of bulkData.recipients) {
      try {
        const messageOptions: twilio.MessageListInstanceCreateOptions = {
          to: recipient,
          body: bulkData.body,
          from: fromNumber,
        };

        if (bulkData.mediaUrl && bulkData.mediaUrl.length > 0) {
          messageOptions.mediaUrl = bulkData.mediaUrl;
        }

        if (bulkData.statusCallback) {
          messageOptions.statusCallback = bulkData.statusCallback;
        }

        const message = await this.client.messages.create(messageOptions);
        
        results.details.push({
          recipient,
          sid: message.sid,
          status: message.status,
          success: true,
        });
        results.sent++;
      } catch (error) {
        results.details.push({
          recipient,
          error: error.message,
          success: false,
        });
        results.failed++;
      }
    }

    return results;
  }

  async getMessage(messageSid: string): Promise<any> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      
      return {
        success: true,
        message: {
          sid: message.sid,
          status: message.status,
          to: message.to,
          from: message.from,
          body: message.body,
          dateCreated: message.dateCreated,
          dateUpdated: message.dateUpdated,
          dateSent: message.dateSent,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          uri: message.uri,
          accountSid: message.accountSid,
          numSegments: message.numSegments,
          numMedia: message.numMedia,
          price: message.price,
          priceUnit: message.priceUnit,
          apiVersion: message.apiVersion,
          subresourceUris: message.subresourceUris,
        },
      };
    } catch (error) {
      console.error('Twilio get message error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getMessages(params: {
    to?: string;
    from?: string;
    dateSent?: Date;
    dateSentAfter?: Date;
    dateSentBefore?: Date;
    limit?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const listOptions: twilio.MessageListInstanceOptions = {};

      if (params.to) {
        listOptions.to = params.to;
      }

      if (params.from) {
        listOptions.from = params.from;
      }

      if (params.dateSent) {
        listOptions.dateSent = params.dateSent;
      }

      if (params.dateSentAfter) {
        listOptions.dateSentAfter = params.dateSentAfter;
      }

      if (params.dateSentBefore) {
        listOptions.dateSentBefore = params.dateSentBefore;
      }

      if (params.limit) {
        listOptions.limit = params.limit;
      }

      if (params.pageSize) {
        listOptions.pageSize = params.pageSize;
      }

      const messages = await this.client.messages.list(listOptions);
      
      return {
        success: true,
        messages: messages.map(message => ({
          sid: message.sid,
          status: message.status,
          to: message.to,
          from: message.from,
          body: message.body,
          dateCreated: message.dateCreated,
          dateUpdated: message.dateUpdated,
          dateSent: message.dateSent,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          uri: message.uri,
          accountSid: message.accountSid,
          numSegments: message.numSegments,
          numMedia: message.numMedia,
          price: message.price,
          priceUnit: message.priceUnit,
          apiVersion: message.apiVersion,
          subresourceUris: message.subresourceUris,
        })),
      };
    } catch (error) {
      console.error('Twilio get messages error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<any> {
    try {
      const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
      
      return {
        success: true,
        phoneNumber: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat,
        formattedInternational: lookup.formattedInternational,
        formattedNational: lookup.formattedNational,
        carrier: {
          name: lookup.carrier?.name,
          type: lookup.carrier?.type,
          mobileCountryCode: lookup.carrier?.mobileCountryCode,
          mobileNetworkCode: lookup.carrier?.mobileNetworkCode,
        },
        url: lookup.url,
      };
    } catch (error) {
      console.error('Twilio phone validation error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
        status: error.status,
      };
    }
  }

  async getAccountInfo(): Promise<any> {
    try {
      const account = await this.client.api.accounts(this.configService.get<string>('TWILIO_ACCOUNT_SID')).fetch();
      
      return {
        success: true,
        account: {
          sid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type,
          dateCreated: account.dateCreated,
          dateUpdated: account.dateUpdated,
          ownerAccountSid: account.ownerAccountSid,
          subresourceUris: account.subresourceUris,
        },
      };
    } catch (error) {
      console.error('Twilio account info error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getUsage(params: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
    includeSubaccounts?: boolean;
    limit?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const usageOptions: twilio.UsageRecordListInstanceOptions = {};

      if (params.category) {
        usageOptions.category = params.category as any;
      }

      if (params.startDate) {
        usageOptions.startDate = params.startDate;
      }

      if (params.endDate) {
        usageOptions.endDate = params.endDate;
      }

      if (params.includeSubaccounts !== undefined) {
        usageOptions.includeSubaccounts = params.includeSubaccounts;
      }

      if (params.limit) {
        usageOptions.limit = params.limit;
      }

      if (params.pageSize) {
        usageOptions.pageSize = params.pageSize;
      }

      const usage = await this.client.usage.records.list(usageOptions);
      
      return {
        success: true,
        usage: usage.map(record => ({
          sid: record.sid,
          accountSid: record.accountSid,
          category: record.category,
          description: record.description,
          startDate: record.startDate,
          endDate: record.endDate,
          count: record.count,
          countUnit: record.countUnit,
          price: record.price,
          priceUnit: record.priceUnit,
          apiVersion: record.apiVersion,
          uri: record.uri,
          subresourceUris: record.subresourceUris,
        })),
      };
    } catch (error) {
      console.error('Twilio usage error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async createShortCode(shortCodeData: {
    friendlyName: string;
    shortCode: string;
    capabilities: string[];
    country: string;
    smsUrl?: string;
    smsMethod?: string;
    smsFallbackUrl?: string;
    smsFallbackMethod?: string;
  }): Promise<any> {
    try {
      const shortCodeOptions: twilio.ShortCodeListInstanceCreateOptions = {
        friendlyName: shortCodeData.friendlyName,
        shortCode: shortCodeData.shortCode,
        capabilities: shortCodeData.capabilities as any[],
        country: shortCodeData.country,
      };

      if (shortCodeData.smsUrl) {
        shortCodeOptions.smsUrl = shortCodeData.smsUrl;
      }

      if (shortCodeData.smsMethod) {
        shortCodeOptions.smsMethod = shortCodeData.smsMethod as any;
      }

      if (shortCodeData.smsFallbackUrl) {
        shortCodeOptions.smsFallbackUrl = shortCodeData.smsFallbackUrl;
      }

      if (shortCodeData.smsFallbackMethod) {
        shortCodeOptions.smsFallbackMethod = shortCodeData.smsFallbackMethod as any;
      }

      const shortCode = await this.client.shortCodes.create(shortCodeOptions);
      
      return {
        success: true,
        shortCode: {
          sid: shortCode.sid,
          accountSid: shortCode.accountSid,
          friendlyName: shortCode.friendlyName,
          shortCode: shortCode.shortCode,
          dateCreated: shortCode.dateCreated,
          dateUpdated: shortCode.dateUpdated,
          country: shortCode.country,
          capabilities: shortCode.capabilities,
          smsUrl: shortCode.smsUrl,
          smsMethod: shortCode.smsMethod,
          smsFallbackUrl: shortCode.smsFallbackUrl,
          smsFallbackMethod: shortCode.smsFallbackMethod,
          uri: shortCode.uri,
          subresourceUris: shortCode.subresourceUris,
        },
      };
    } catch (error) {
      console.error('Twilio short code creation error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getShortCodes(params?: {
    friendlyName?: string;
    shortCode?: string;
    country?: string;
    limit?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const listOptions: twilio.ShortCodeListInstanceOptions = {};

      if (params?.friendlyName) {
        listOptions.friendlyName = params.friendlyName;
      }

      if (params?.shortCode) {
        listOptions.shortCode = params.shortCode;
      }

      if (params?.country) {
        listOptions.country = params.country;
      }

      if (params?.limit) {
        listOptions.limit = params.limit;
      }

      if (params?.pageSize) {
        listOptions.pageSize = params.pageSize;
      }

      const shortCodes = await this.client.shortCodes.list(listOptions);
      
      return {
        success: true,
        shortCodes: shortCodes.map(shortCode => ({
          sid: shortCode.sid,
          accountSid: shortCode.accountSid,
          friendlyName: shortCode.friendlyName,
          shortCode: shortCode.shortCode,
          dateCreated: shortCode.dateCreated,
          dateUpdated: shortCode.dateUpdated,
          country: shortCode.country,
          capabilities: shortCode.capabilities,
          smsUrl: shortCode.smsUrl,
          smsMethod: shortCode.smsMethod,
          smsFallbackUrl: shortCode.smsFallbackUrl,
          smsFallbackMethod: shortCode.smsFallbackMethod,
          uri: shortCode.uri,
          subresourceUris: shortCode.subresourceUris,
        })),
      };
    } catch (error) {
      console.error('Twilio get short codes error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async createMessagingService(serviceData: {
    friendlyName: string;
    inboundRequestUrl?: string;
    fallbackUrl?: string;
    statusCallback?: string;
    stickySender?: boolean;
    scanMessageContent?: boolean;
    fallbackToLongCode?: boolean;
    areaCodeGeomatch?: boolean;
    smartEncoding?: boolean;
    mmsConverter?: boolean;
  }): Promise<any> {
    try {
      const serviceOptions: twilio.MessagingServiceListInstanceCreateOptions = {
        friendlyName: serviceData.friendlyName,
      };

      if (serviceData.inboundRequestUrl) {
        serviceOptions.inboundRequestUrl = serviceData.inboundRequestUrl;
      }

      if (serviceData.fallbackUrl) {
        serviceOptions.fallbackUrl = serviceData.fallbackUrl;
      }

      if (serviceData.statusCallback) {
        serviceOptions.statusCallback = serviceData.statusCallback;
      }

      if (serviceData.stickySender !== undefined) {
        serviceOptions.stickySender = serviceData.stickySender;
      }

      if (serviceData.scanMessageContent !== undefined) {
        serviceOptions.scanMessageContent = serviceData.scanMessageContent;
      }

      if (serviceData.fallbackToLongCode !== undefined) {
        serviceOptions.fallbackToLongCode = serviceData.fallbackToLongCode;
      }

      if (serviceData.areaCodeGeomatch !== undefined) {
        serviceOptions.areaCodeGeomatch = serviceData.areaCodeGeomatch;
      }

      if (serviceData.smartEncoding !== undefined) {
        serviceOptions.smartEncoding = serviceData.smartEncoding;
      }

      if (serviceData.mmsConverter !== undefined) {
        serviceOptions.mmsConverter = serviceData.mmsConverter;
      }

      const service = await this.client.messagingServices.create(serviceOptions);
      
      return {
        success: true,
        service: {
          sid: service.sid,
          accountSid: service.accountSid,
          friendlyName: service.friendlyName,
          dateCreated: service.dateCreated,
          dateUpdated: service.dateUpdated,
          inboundRequestUrl: service.inboundRequestUrl,
          fallbackUrl: service.fallbackUrl,
          statusCallback: service.statusCallback,
          stickySender: service.stickySender,
          scanMessageContent: service.scanMessageContent,
          fallbackToLongCode: service.fallbackToLongCode,
          areaCodeGeomatch: service.areaCodeGeomatch,
          smartEncoding: service.smartEncoding,
          mmsConverter: service.mmsConverter,
          uri: service.uri,
          subresourceUris: service.subresourceUris,
        },
      };
    } catch (error) {
      console.error('Twilio messaging service creation error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getMessagingServices(params?: {
    friendlyName?: string;
    limit?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const listOptions: twilio.MessagingServiceListInstanceOptions = {};

      if (params?.friendlyName) {
        listOptions.friendlyName = params.friendlyName;
      }

      if (params?.limit) {
        listOptions.limit = params.limit;
      }

      if (params?.pageSize) {
        listOptions.pageSize = params.pageSize;
      }

      const services = await this.client.messagingServices.list(listOptions);
      
      return {
        success: true,
        services: services.map(service => ({
          sid: service.sid,
          accountSid: service.accountSid,
          friendlyName: service.friendlyName,
          dateCreated: service.dateCreated,
          dateUpdated: service.dateUpdated,
          inboundRequestUrl: service.inboundRequestUrl,
          fallbackUrl: service.fallbackUrl,
          statusCallback: service.statusCallback,
          stickySender: service.stickySender,
          scanMessageContent: service.scanMessageContent,
          fallbackToLongCode: service.fallbackToLongCode,
          areaCodeGeomatch: service.areaCodeGeomatch,
          smartEncoding: service.smartEncoding,
          mmsConverter: service.mmsConverter,
          uri: service.uri,
          subresourceUris: service.subresourceUris,
        })),
      };
    } catch (error) {
      console.error('Twilio get messaging services error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async testConfiguration(): Promise<any> {
    try {
      const accountInfo = await this.getAccountInfo();
      return {
        success: true,
        message: 'Twilio configuration is valid',
        accountInfo,
      };
    } catch (error) {
      console.error('Twilio configuration test failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async getIncomingNumbers(params?: {
    friendlyName?: string;
    phoneNumber?: string;
    origin?: string;
    limit?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const listOptions: twilio.IncomingPhoneNumberListInstanceOptions = {};

      if (params?.friendlyName) {
        listOptions.friendlyName = params.friendlyName;
      }

      if (params?.phoneNumber) {
        listOptions.phoneNumber = params.phoneNumber;
      }

      if (params?.origin) {
        listOptions.origin = params.origin;
      }

      if (params?.limit) {
        listOptions.limit = params.limit;
      }

      if (params?.pageSize) {
        listOptions.pageSize = params.pageSize;
      }

      const numbers = await this.client.incomingPhoneNumbers.list(listOptions);
      
      return {
        success: true,
        numbers: numbers.map(number => ({
          sid: number.sid,
          accountSid: number.accountSid,
          friendlyName: number.friendlyName,
          phoneNumber: number.phoneNumber,
          voiceUrl: number.voiceUrl,
          voiceMethod: number.voiceMethod,
          voiceFallbackUrl: number.voiceFallbackUrl,
          voiceFallbackMethod: number.voiceFallbackMethod,
          dateCreated: number.dateCreated,
          dateUpdated: number.dateUpdated,
          smsUrl: number.smsUrl,
          smsMethod: number.smsMethod,
          smsFallbackUrl: number.smsFallbackUrl,
          smsFallbackMethod: number.smsFallbackMethod,
          addressRequirements: number.addressRequirements,
          beta: number.beta,
          capabilities: number.capabilities,
          status: number.status,
          uri: number.uri,
          subresourceUris: number.subresourceUris,
        })),
      };
    } catch (error) {
      console.error('Twilio get incoming numbers error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async purchasePhoneNumber(phoneNumberData: {
    phoneNumber: string;
    friendlyName?: string;
    areaCode?: string;
  }): Promise<any> {
    try {
      const purchaseOptions: twilio.IncomingPhoneNumberListInstanceCreateOptions = {
        phoneNumber: phoneNumberData.phoneNumber,
      };

      if (phoneNumberData.friendlyName) {
        purchaseOptions.friendlyName = phoneNumberData.friendlyName;
      }

      if (phoneNumberData.areaCode) {
        purchaseOptions.areaCode = phoneNumberData.areaCode;
      }

      const number = await this.client.incomingPhoneNumbers.create(purchaseOptions);
      
      return {
        success: true,
        number: {
          sid: number.sid,
          accountSid: number.accountSid,
          friendlyName: number.friendlyName,
          phoneNumber: number.phoneNumber,
          voiceUrl: number.voiceUrl,
          voiceMethod: number.voiceMethod,
          voiceFallbackUrl: number.voiceFallbackUrl,
          voiceFallbackMethod: number.voiceFallbackMethod,
          dateCreated: number.dateCreated,
          dateUpdated: number.dateUpdated,
          smsUrl: number.smsUrl,
          smsMethod: number.smsMethod,
          smsFallbackUrl: number.smsFallbackUrl,
          smsFallbackMethod: number.smsFallbackMethod,
          addressRequirements: number.addressRequirements,
          beta: number.beta,
          capabilities: number.capabilities,
          status: number.status,
          uri: number.uri,
          subresourceUris: number.subresourceUris,
        },
      };
    } catch (error) {
      console.error('Twilio purchase phone number error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  async releasePhoneNumber(phoneNumberSid: string): Promise<any> {
    try {
      await this.client.incomingPhoneNumbers(phoneNumberSid).remove();
      
      return {
        success: true,
        message: 'Phone number released successfully',
        phoneNumberSid,
      };
    } catch (error) {
      console.error('Twilio release phone number error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }
}
