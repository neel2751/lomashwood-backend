import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { LandingPageStatus, LandingPageType } from '../entities/landing-page.entity';

export class CreateLandingPageDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(LandingPageStatus)
  status?: LandingPageStatus;

  @IsOptional()
  @IsEnum(LandingPageType)
  type?: LandingPageType;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  openGraph?: string;

  @IsOptional()
  @IsString()
  twitterCard?: string;

  @IsOptional()
  @IsString()
  schemaMarkup?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  redirectType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  redirectDelay?: number;

  @IsOptional()
  @IsBoolean()
  popupEnabled?: boolean;

  @IsOptional()
  @IsString()
  popupContent?: string;

  @IsOptional()
  @IsString()
  popupTrigger?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  popupDelay?: number;

  @IsOptional()
  @IsBoolean()
  exitIntentEnabled?: boolean;

  @IsOptional()
  @IsString()
  exitIntentContent?: string;

  @IsOptional()
  @IsString()
  exitIntentTrigger?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exitIntentDelay?: number;

  @IsOptional()
  @IsBoolean()
  scrollDepthEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scrollDepthTrigger?: number;

  @IsOptional()
  @IsString()
  scrollDepthContent?: string;

  @IsOptional()
  @IsBoolean()
  timeOnPageEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeOnPageTrigger?: number;

  @IsOptional()
  @IsString()
  timeOnPageContent?: string;

  @IsOptional()
  @IsBoolean()
  inactivityEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inactivityTrigger?: number;

  @IsOptional()
  @IsString()
  inactivityContent?: string;

  @IsOptional()
  @IsBoolean()
  geoTargeting?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geoCountries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geoRegions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geoCities?: string[];

  @IsOptional()
  @IsBoolean()
  deviceTargeting?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceOs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceBrowsers?: string[];

  @IsOptional()
  @IsBoolean()
  timeTargeting?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeZones?: string[];

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @IsBoolean()
  scheduleEnabled?: boolean;

  @IsOptional()
  @IsString()
  scheduleStart?: string;

  @IsOptional()
  @IsString()
  scheduleEnd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scheduleDays?: string[];

  @IsOptional()
  @IsString()
  scheduleTimezone?: string;

  @IsOptional()
  @IsBoolean()
  aBTestEnabled?: boolean;

  @IsOptional()
  @IsString()
  aBTestId?: string;

  @IsOptional()
  @IsString()
  aBTestVariant?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aBTestTraffic?: number;

  @IsOptional()
  @IsString()
  aBTestGoal?: string;

  @IsOptional()
  @IsBoolean()
  personalizationEnabled?: boolean;

  @IsOptional()
  @IsString()
  personalizationRules?: string;

  @IsOptional()
  @IsString()
  personalizationData?: string;

  @IsOptional()
  @IsBoolean()
  trackingEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trackingPixels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trackingScripts?: string[];

  @IsOptional()
  @IsString()
  conversionTracking?: string;

  @IsOptional()
  @IsBoolean()
  heatmapsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sessionRecordingEnabled?: boolean;

  @IsOptional()
  @IsString()
  formIntegration?: string;

  @IsOptional()
  @IsString()
  crmIntegration?: string;

  @IsOptional()
  @IsString()
  emailIntegration?: string;

  @IsOptional()
  @IsString()
  smsIntegration?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  webhookEvents?: string[];

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  apiEnabled?: boolean;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  apiRateLimit?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  apiPermissions?: string[];

  @IsOptional()
  @IsBoolean()
  cacheEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cacheTtl?: number;

  @IsOptional()
  @IsBoolean()
  cdnEnabled?: boolean;

  @IsOptional()
  @IsString()
  cdnUrl?: string;

  @IsOptional()
  @IsString()
  securityHeaders?: string;

  @IsOptional()
  @IsBoolean()
  sslRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  passwordProtected?: boolean;

  @IsOptional()
  @IsString()
  passwordHash?: string;

  @IsOptional()
  @IsString()
  passwordHint?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipBlacklist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countryWhitelist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countryBlacklist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referrerWhitelist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referrerBlacklist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userAgentWhitelist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userAgentBlacklist?: string[];

  @IsOptional()
  @IsBoolean()
  rateLimitEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimitRequests?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimitWindow?: number;

  @IsOptional()
  @IsString()
  rateLimitMessage?: string;

  @IsOptional()
  @IsBoolean()
  ddosProtection?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  ddosThreshold?: number;

  @IsOptional()
  @IsString()
  ddosAction?: string;

  @IsOptional()
  @IsBoolean()
  backupEnabled?: boolean;

  @IsOptional()
  @IsString()
  backupFrequency?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  backupRetention?: number;

  @IsOptional()
  @IsString()
  backupLocation?: string;

  @IsOptional()
  @IsBoolean()
  testingEnabled?: boolean;

  @IsOptional()
  @IsString()
  testingEnvironment?: string;

  @IsOptional()
  @IsString()
  testingData?: string;

  @IsOptional()
  @IsBoolean()
  stagingEnabled?: boolean;

  @IsOptional()
  @IsString()
  stagingEnvironment?: string;

  @IsOptional()
  @IsString()
  stagingData?: string;

  @IsOptional()
  @IsBoolean()
  productionEnabled?: boolean;

  @IsOptional()
  @IsString()
  productionEnvironment?: string;

  @IsOptional()
  @IsString()
  productionData?: string;

  @IsOptional()
  @IsBoolean()
  monitoringEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  monitoringAlerts?: string[];

  @IsOptional()
  @IsString()
  monitoringThresholds?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  monitoringNotifications?: string[];

  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean;

  @IsOptional()
  @IsString()
  analyticsProvider?: string;

  @IsOptional()
  @IsString()
  analyticsTrackingId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  analyticsGoals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  analyticsEvents?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  analyticsCustomDimensions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  analyticsCustomMetrics?: string[];

  @IsOptional()
  @IsBoolean()
  performanceEnabled?: boolean;

  @IsOptional()
  @IsString()
  performanceThresholds?: string;

  @IsOptional()
  @IsString()
  performanceOptimization?: string;

  @IsOptional()
  @IsString()
  performanceMonitoring?: string;

  @IsOptional()
  @IsBoolean()
  accessibilityEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessibilityStandards?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessibilityTools?: string[];

  @IsOptional()
  @IsString()
  accessibilityAudit?: string;

  @IsOptional()
  @IsBoolean()
  seoEnabled?: boolean;

  @IsOptional()
  @IsString()
  seoOptimization?: string;

  @IsOptional()
  @IsString()
  seoAudit?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoRecommendations?: string[];

  @IsOptional()
  @IsBoolean()
  socialSharingEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialPlatforms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialMessages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialVideos?: string[];

  @IsOptional()
  @IsString()
  socialAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  emailMarketingEnabled?: boolean;

  @IsOptional()
  @IsString()
  emailProvider?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailLists?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailTemplates?: string[];

  @IsOptional()
  @IsString()
  emailAutomation?: string;

  @IsOptional()
  @IsString()
  emailAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  smsMarketingEnabled?: boolean;

  @IsOptional()
  @IsString()
  smsProvider?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  smsLists?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  smsTemplates?: string[];

  @IsOptional()
  @IsString()
  smsAutomation?: string;

  @IsOptional()
  @IsString()
  smsAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  pushNotificationsEnabled?: boolean;

  @IsOptional()
  @IsString()
  pushProvider?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pushSegments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pushTemplates?: string[];

  @IsOptional()
  @IsString()
  pushAutomation?: string;

  @IsOptional()
  @IsString()
  pushAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsString()
  chatProvider?: string;

  @IsOptional()
  @IsString()
  chatWidget?: string;

  @IsOptional()
  @IsString()
  chatSettings?: string;

  @IsOptional()
  @IsString()
  chatAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  supportEnabled?: boolean;

  @IsOptional()
  @IsString()
  supportProvider?: string;

  @IsOptional()
  @IsString()
  supportWidget?: string;

  @IsOptional()
  @IsString()
  supportSettings?: string;

  @IsOptional()
  @IsString()
  supportAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  faqEnabled?: boolean;

  @IsOptional()
  @IsString()
  faqProvider?: string;

  @IsOptional()
  @IsString()
  faqWidget?: string;

  @IsOptional()
  @IsString()
  faqSettings?: string;

  @IsOptional()
  @IsString()
  faqAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  helpCenterEnabled?: boolean;

  @IsOptional()
  @IsString()
  helpCenterProvider?: string;

  @IsOptional()
  @IsString()
  helpCenterWidget?: string;

  @IsOptional()
  @IsString()
  helpCenterSettings?: string;

  @IsOptional()
  @IsString()
  helpCenterAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  documentationEnabled?: boolean;

  @IsOptional()
  @IsString()
  documentationProvider?: string;

  @IsOptional()
  @IsString()
  documentationWidget?: string;

  @IsOptional()
  @IsString()
  documentationSettings?: string;

  @IsOptional()
  @IsString()
  documentationAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  communityEnabled?: boolean;

  @IsOptional()
  @IsString()
  communityProvider?: string;

  @IsOptional()
  @IsString()
  communityWidget?: string;

  @IsOptional()
  @IsString()
  communitySettings?: string;

  @IsOptional()
  @IsString()
  communityAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  forumEnabled?: boolean;

  @IsOptional()
  @IsString()
  forumProvider?: string;

  @IsOptional()
  @IsString()
  forumWidget?: string;

  @IsOptional()
  @IsString()
  forumSettings?: string;

  @IsOptional()
  @IsString()
  forumAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  blogEnabled?: boolean;

  @IsOptional()
  @IsString()
  blogProvider?: string;

  @IsOptional()
  @IsString()
  blogWidget?: string;

  @IsOptional()
  @IsString()
  blogSettings?: string;

  @IsOptional()
  @IsString()
  blogAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  galleryEnabled?: boolean;

  @IsOptional()
  @IsString()
  galleryProvider?: string;

  @IsOptional()
  @IsString()
  galleryWidget?: string;

  @IsOptional()
  @IsString()
  gallerySettings?: string;

  @IsOptional()
  @IsString()
  galleryAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  videoEnabled?: boolean;

  @IsOptional()
  @IsString()
  videoProvider?: string;

  @IsOptional()
  @IsString()
  videoWidget?: string;

  @IsOptional()
  @IsString()
  videoSettings?: string;

  @IsOptional()
  @IsString()
  videoAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  audioEnabled?: boolean;

  @IsOptional()
  @IsString()
  audioProvider?: string;

  @IsOptional()
  @IsString()
  audioWidget?: string;

  @IsOptional()
  @IsString()
  audioSettings?: string;

  @IsOptional()
  @IsString()
  audioAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  downloadEnabled?: boolean;

  @IsOptional()
  @IsString()
  downloadProvider?: string;

  @IsOptional()
  @IsString()
  downloadWidget?: string;

  @IsOptional()
  @IsString()
  downloadSettings?: string;

  @IsOptional()
  @IsString()
  downloadAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  uploadEnabled?: boolean;

  @IsOptional()
  @IsString()
  uploadProvider?: string;

  @IsOptional()
  @IsString()
  uploadWidget?: string;

  @IsOptional()
  @IsString()
  uploadSettings?: string;

  @IsOptional()
  @IsString()
  uploadAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  calendarEnabled?: boolean;

  @IsOptional()
  @IsString()
  calendarProvider?: string;

  @IsOptional()
  @IsString()
  calendarWidget?: string;

  @IsOptional()
  @IsString()
  calendarSettings?: string;

  @IsOptional()
  @IsString()
  calendarAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  bookingEnabled?: boolean;

  @IsOptional()
  @IsString()
  bookingProvider?: string;

  @IsOptional()
  @IsString()
  bookingWidget?: string;

  @IsOptional()
  @IsString()
  bookingSettings?: string;

  @IsOptional()
  @IsString()
  bookingAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  paymentEnabled?: boolean;

  @IsOptional()
  @IsString()
  paymentProvider?: string;

  @IsOptional()
  @IsString()
  paymentWidget?: string;

  @IsOptional()
  @IsString()
  paymentSettings?: string;

  @IsOptional()
  @IsString()
  paymentAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  donationEnabled?: boolean;

  @IsOptional()
  @IsString()
  donationProvider?: string;

  @IsOptional()
  @IsString()
  donationWidget?: string;

  @IsOptional()
  @IsString()
  donationSettings?: string;

  @IsOptional()
  @IsString()
  donationAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  subscriptionEnabled?: boolean;

  @IsOptional()
  @IsString()
  subscriptionProvider?: string;

  @IsOptional()
  @IsString()
  subscriptionWidget?: string;

  @IsOptional()
  @IsString()
  subscriptionSettings?: string;

  @IsOptional()
  @IsString()
  subscriptionAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  membershipEnabled?: boolean;

  @IsOptional()
  @IsString()
  membershipProvider?: string;

  @IsOptional()
  @IsString()
  membershipWidget?: string;

  @IsOptional()
  @IsString()
  membershipSettings?: string;

  @IsOptional()
  @IsString()
  membershipAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  loyaltyEnabled?: boolean;

  @IsOptional()
  @IsString()
  loyaltyProvider?: string;

  @IsOptional()
  @IsString()
  loyaltyWidget?: string;

  @IsOptional()
  @IsString()
  loyaltySettings?: string;

  @IsOptional()
  @IsString()
  loyaltyAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  referralEnabled?: boolean;

  @IsOptional()
  @IsString()
  referralProvider?: string;

  @IsOptional()
  @IsString()
  referralWidget?: string;

  @IsOptional()
  @IsString()
  referralSettings?: string;

  @IsOptional()
  @IsString()
  referralAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  affiliateEnabled?: boolean;

  @IsOptional()
  @IsString()
  affiliateProvider?: string;

  @IsOptional()
  @IsString()
  affiliateWidget?: string;

  @IsOptional()
  @IsString()
  affiliateSettings?: string;

  @IsOptional()
  @IsString()
  affiliateAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  partnershipEnabled?: boolean;

  @IsOptional()
  @IsString()
  partnershipProvider?: string;

  @IsOptional()
  @IsString()
  partnershipWidget?: string;

  @IsOptional()
  @IsString()
  partnershipSettings?: string;

  @IsOptional()
  @IsString()
  partnershipAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  sponsorshipEnabled?: boolean;

  @IsOptional()
  @IsString()
  sponsorshipProvider?: string;

  @IsOptional()
  @IsString()
  sponsorshipWidget?: string;

  @IsOptional()
  @IsString()
  sponsorshipSettings?: string;

  @IsOptional()
  @IsString()
  sponsorshipAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  advertisingEnabled?: boolean;

  @IsOptional()
  @IsString()
  advertisingProvider?: string;

  @IsOptional()
  @IsString()
  advertisingWidget?: string;

  @IsOptional()
  @IsString()
  advertisingSettings?: string;

  @IsOptional()
  @IsString()
  advertisingAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  marketplaceEnabled?: boolean;

  @IsOptional()
  @IsString()
  marketplaceProvider?: string;

  @IsOptional()
  @IsString()
  marketplaceWidget?: string;

  @IsOptional()
  @IsString()
  marketplaceSettings?: string;

  @IsOptional()
  @IsString()
  marketplaceAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  integrationEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  integrationProviders?: string[];

  @IsOptional()
  @IsString()
  integrationSettings?: string;

  @IsOptional()
  @IsString()
  integrationAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  automationEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  automationProviders?: string[];

  @IsOptional()
  @IsString()
  automationSettings?: string;

  @IsOptional()
  @IsString()
  automationAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aiProviders?: string[];

  @IsOptional()
  @IsString()
  aiSettings?: string;

  @IsOptional()
  @IsString()
  aiAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  mlEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mlProviders?: string[];

  @IsOptional()
  @IsString()
  mlSettings?: string;

  @IsOptional()
  @IsString()
  mlAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  blockchainEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockchainProviders?: string[];

  @IsOptional()
  @IsString()
  blockchainSettings?: string;

  @IsOptional()
  @IsString()
  blockchainAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  arEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  arProviders?: string[];

  @IsOptional()
  @IsString()
  arSettings?: string;

  @IsOptional()
  @IsString()
  arAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  vrEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vrProviders?: string[];

  @IsOptional()
  @IsString()
  vrSettings?: string;

  @IsOptional()
  @IsString()
  vrAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  mrEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mrProviders?: string[];

  @IsOptional()
  @IsString()
  mrSettings?: string;

  @IsOptional()
  @IsString()
  mrAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  iotEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  iotProviders?: string[];

  @IsOptional()
  @IsString()
  iotSettings?: string;

  @IsOptional()
  @IsString()
  iotAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  cloudEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cloudProviders?: string[];

  @IsOptional()
  @IsString()
  cloudSettings?: string;

  @IsOptional()
  @IsString()
  cloudAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  edgeEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  edgeProviders?: string[];

  @IsOptional()
  @IsString()
  edgeSettings?: string;

  @IsOptional()
  @IsString()
  edgeAnalytics?: string;

  @IsOptional()
  @IsBoolean()
  quantumEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quantumProviders?: string[];

  @IsOptional()
  @IsString()
  quantumSettings?: string;

  @IsOptional()
  @IsString()
  quantumAnalytics?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
