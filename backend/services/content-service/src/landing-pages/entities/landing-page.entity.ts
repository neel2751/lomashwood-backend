import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum LandingPageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum LandingPageType {
  PRODUCT_LAUNCH = 'PRODUCT_LAUNCH',
  LEAD_GENERATION = 'LEAD_GENERATION',
  EVENT_REGISTRATION = 'EVENT_REGISTRATION',
  WEBINAR = 'WEBINAR',
  NEWSLETTER = 'NEWSLETTER',
  EBOOK_DOWNLOAD = 'EBOOK_DOWNLOAD',
  CONTEST = 'CONTEST',
  GIVEAWAY = 'GIVEAWAY',
  SURVEY = 'SURVEY',
  CUSTOM = 'CUSTOM',
}

@Entity('landing_pages')
export class LandingPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: LandingPageStatus,
    default: LandingPageStatus.DRAFT,
  })
  status: LandingPageStatus;

  @Column({
    type: 'enum',
    enum: LandingPageType,
    default: LandingPageType.CUSTOM,
  })
  type: LandingPageType;

  @Column({ nullable: true })
  template: string;

  @Column({ nullable: true })
  campaign: string;

  @Column({ nullable: true })
  metadata: string;

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column({ nullable: true })
  seoKeywords: string[];

  @Column({ nullable: true })
  canonicalUrl: string;

  @Column({ nullable: true })
  openGraph: string;

  @Column({ nullable: true })
  twitterCard: string;

  @Column({ nullable: true })
  schemaMarkup: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  featured: boolean;

  @Column({ nullable: true })
  featuredAt: Date;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  publishedBy: string;

  @Column({ nullable: true })
  archivedAt: Date;

  @Column({ nullable: true })
  archivedBy: string;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ nullable: true })
  deletionReason: string;

  @Column({ nullable: true })
  viewCount: number;

  @Column({ nullable: true })
  uniqueViewCount: number;

  @Column({ nullable: true })
  conversionCount: number;

  @Column({ nullable: true })
  conversionValue: number;

  @Column({ nullable: true })
  conversionRate: number;

  @Column({ nullable: true })
  avgTimeOnPage: number;

  @Column({ nullable: true })
  bounceRate: number;

  @Column({ nullable: true })
  duplicatedFrom: string;

  @Column({ nullable: true })
  duplicatedBy: string;

  @Column({ nullable: true })
  duplicatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  lastModifiedAt: Date;

  @Column({ nullable: true })
  lastModifiedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  rejectedBy: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  tags: string[];

  @Column({ nullable: true })
  categories: string[];

  @Column({ nullable: true })
  priority: number;

  @Column({ nullable: true })
  sortOrder: number;

  @Column({ nullable: true })
  expirationDate: Date;

  @Column({ nullable: true })
  redirectUrl: string;

  @Column({ nullable: true })
  redirectType: string;

  @Column({ nullable: true })
  redirectDelay: number;

  @Column({ nullable: true })
  popupEnabled: boolean;

  @Column({ nullable: true })
  popupContent: string;

  @Column({ nullable: true })
  popupTrigger: string;

  @Column({ nullable: true })
  popupDelay: number;

  @Column({ nullable: true })
  exitIntentEnabled: boolean;

  @Column({ nullable: true })
  exitIntentContent: string;

  @Column({ nullable: true })
  exitIntentTrigger: string;

  @Column({ nullable: true })
  exitIntentDelay: number;

  @Column({ nullable: true })
  scrollDepthEnabled: boolean;

  @Column({ nullable: true })
  scrollDepthTrigger: number;

  @Column({ nullable: true })
  scrollDepthContent: string;

  @Column({ nullable: true })
  timeOnPageEnabled: boolean;

  @Column({ nullable: true })
  timeOnPageTrigger: number;

  @Column({ nullable: true })
  timeOnPageContent: string;

  @Column({ nullable: true })
  inactivityEnabled: boolean;

  @Column({ nullable: true })
  inactivityTrigger: number;

  @Column({ nullable: true })
  inactivityContent: string;

  @Column({ nullable: true })
  geoTargeting: boolean;

  @Column({ nullable: true })
  geoCountries: string[];

  @Column({ nullable: true })
  geoRegions: string[];

  @Column({ nullable: true })
  geoCities: string[];

  @Column({ nullable: true })
  deviceTargeting: boolean;

  @Column({ nullable: true })
  deviceTypes: string[];

  @Column({ nullable: true })
  deviceOs: string[];

  @Column({ nullable: true })
  deviceBrowsers: string[];

  @Column({ nullable: true })
  timeTargeting: boolean;

  @Column({ nullable: true })
  timeZones: string[];

  @Column({ nullable: true })
  businessHours: string;

  @Column({ nullable: true })
  scheduleEnabled: boolean;

  @Column({ nullable: true })
  scheduleStart: Date;

  @Column({ nullable: true })
  scheduleEnd: Date;

  @Column({ nullable: true })
  scheduleDays: string[];

  @Column({ nullable: true })
  scheduleTimezone: string;

  @Column({ nullable: true })
  aBTestEnabled: boolean;

  @Column({ nullable: true })
  aBTestId: string;

  @Column({ nullable: true })
  aBTestVariant: string;

  @Column({ nullable: true })
  aBTestTraffic: number;

  @Column({ nullable: true })
  aBTestGoal: string;

  @Column({ nullable: true })
  aBTestResults: string;

  @Column({ nullable: true })
  personalizationEnabled: boolean;

  @Column({ nullable: true })
  personalizationRules: string;

  @Column({ nullable: true })
  personalizationData: string;

  @Column({ nullable: true })
  trackingEnabled: boolean;

  @Column({ nullable: true })
  trackingPixels: string[];

  @Column({ nullable: true })
  trackingScripts: string[];

  @Column({ nullable: true })
  conversionTracking: string;

  @Column({ nullable: true })
  heatmapsEnabled: boolean;

  @Column({ nullable: true })
  sessionRecordingEnabled: boolean;

  @Column({ nullable: true })
  formIntegration: string;

  @Column({ nullable: true })
  crmIntegration: string;

  @Column({ nullable: true })
  emailIntegration: string;

  @Column({ nullable: true })
  smsIntegration: string;

  @Column({ nullable: true })
  webhookUrl: string;

  @Column({ nullable: true })
  webhookEvents: string[];

  @Column({ nullable: true })
  webhookSecret: string;

  @Column({ nullable: true })
  apiEnabled: boolean;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  apiRateLimit: number;

  @Column({ nullable: true })
  apiPermissions: string[];

  @Column({ nullable: true })
  cacheEnabled: boolean;

  @Column({ nullable: true })
  cacheTtl: number;

  @Column({ nullable: true })
  cdnEnabled: boolean;

  @Column({ nullable: true })
  cdnUrl: string;

  @Column({ nullable: true })
  securityHeaders: string;

  @Column({ nullable: true })
  sslRequired: boolean;

  @Column({ nullable: true })
  passwordProtected: boolean;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  passwordHint: string;

  @Column({ nullable: true })
  ipWhitelist: string[];

  @Column({ nullable: true })
  ipBlacklist: string[];

  @Column({ nullable: true })
  countryWhitelist: string[];

  @Column({ nullable: true })
  countryBlacklist: string[];

  @Column({ nullable: true })
  referrerWhitelist: string[];

  @Column({ nullable: true })
  referrerBlacklist: string[];

  @Column({ nullable: true })
  userAgentWhitelist: string[];

  @Column({ nullable: true })
  userAgentBlacklist: string[];

  @Column({ nullable: true })
  rateLimitEnabled: boolean;

  @Column({ nullable: true })
  rateLimitRequests: number;

  @Column({ nullable: true })
  rateLimitWindow: number;

  @Column({ nullable: true })
  rateLimitMessage: string;

  @Column({ nullable: true })
  ddosProtection: boolean;

  @Column({ nullable: true })
  ddosThreshold: number;

  @Column({ nullable: true })
  ddosAction: string;

  @Column({ nullable: true })
  backupEnabled: boolean;

  @Column({ nullable: true })
  backupFrequency: string;

  @Column({ nullable: true })
  backupRetention: number;

  @Column({ nullable: true })
  backupLocation: string;

  @Column({ nullable: true })
  version: number;

  @Column({ nullable: true })
  changelog: string;

  @Column({ nullable: true })
  migration: string;

  @Column({ nullable: true })
  rollbackEnabled: boolean;

  @Column({ nullable: true })
  rollbackPoint: string;

  @Column({ nullable: true })
  testingEnabled: boolean;

  @Column({ nullable: true })
  testingEnvironment: string;

  @Column({ nullable: true })
  testingData: string;

  @Column({ nullable: true })
  stagingEnabled: boolean;

  @Column({ nullable: true })
  stagingEnvironment: string;

  @Column({ nullable: true })
  stagingData: string;

  @Column({ nullable: true })
  productionEnabled: boolean;

  @Column({ nullable: true })
  productionEnvironment: string;

  @Column({ nullable: true })
  productionData: string;

  @Column({ nullable: true })
  monitoringEnabled: boolean;

  @Column({ nullable: true })
  monitoringAlerts: string[];

  @Column({ nullable: true })
  monitoringThresholds: string;

  @Column({ nullable: true })
  monitoringNotifications: string[];

  @Column({ nullable: true })
  analyticsEnabled: boolean;

  @Column({ nullable: true })
  analyticsProvider: string;

  @Column({ nullable: true })
  analyticsTrackingId: string;

  @Column({ nullable: true })
  analyticsGoals: string[];

  @Column({ nullable: true })
  analyticsEvents: string[];

  @Column({ nullable: true })
  analyticsCustomDimensions: string[];

  @Column({ nullable: true })
  analyticsCustomMetrics: string[];

  @Column({ nullable: true })
  performanceEnabled: boolean;

  @Column({ nullable: true })
  performanceThresholds: string;

  @Column({ nullable: true })
  performanceOptimization: string;

  @Column({ nullable: true })
  performanceMonitoring: string;

  @Column({ nullable: true })
  accessibilityEnabled: boolean;

  @Column({ nullable: true })
  accessibilityStandards: string[];

  @Column({ nullable: true })
  accessibilityTools: string[];

  @Column({ nullable: true })
  accessibilityAudit: string;

  @Column({ nullable: true })
  seoEnabled: boolean;

  @Column({ nullable: true })
  seoOptimization: string;

  @Column({ nullable: true })
  seoAudit: string;

  @Column({ nullable: true })
  seoRecommendations: string[];

  @Column({ nullable: true })
  socialSharingEnabled: boolean;

  @Column({ nullable: true })
  socialPlatforms: string[];

  @Column({ nullable: true })
  socialMessages: string[];

  @Column({ nullable: true })
  socialImages: string[];

  @Column({ nullable: true })
  socialVideos: string[];

  @Column({ nullable: true })
  socialAnalytics: string;

  @Column({ nullable: true })
  emailMarketingEnabled: boolean;

  @Column({ nullable: true })
  emailProvider: string;

  @Column({ nullable: true })
  emailLists: string[];

  @Column({ nullable: true })
  emailTemplates: string[];

  @Column({ nullable: true })
  emailAutomation: string;

  @Column({ nullable: true })
  emailAnalytics: string;

  @Column({ nullable: true })
  smsMarketingEnabled: boolean;

  @Column({ nullable: true })
  smsProvider: string;

  @Column({ nullable: true })
  smsLists: string[];

  @Column({ nullable: true })
  smsTemplates: string[];

  @Column({ nullable: true })
  smsAutomation: string;

  @Column({ nullable: true })
  smsAnalytics: string;

  @Column({ nullable: true })
  pushNotificationsEnabled: boolean;

  @Column({ nullable: true })
  pushProvider: string;

  @Column({ nullable: true })
  pushSegments: string[];

  @Column({ nullable: true })
  pushTemplates: string[];

  @Column({ nullable: true })
  pushAutomation: string;

  @Column({ nullable: true })
  pushAnalytics: string;

  @Column({ nullable: true })
  chatEnabled: boolean;

  @Column({ nullable: true })
  chatProvider: string;

  @Column({ nullable: true })
  chatWidget: string;

  @Column({ nullable: true })
  chatSettings: string;

  @Column({ nullable: true })
  chatAnalytics: string;

  @Column({ nullable: true })
  supportEnabled: boolean;

  @Column({ nullable: true })
  supportProvider: string;

  @Column({ nullable: true })
  supportWidget: string;

  @Column({ nullable: true })
  supportSettings: string;

  @Column({ nullable: true })
  supportAnalytics: string;

  @Column({ nullable: true })
  faqEnabled: boolean;

  @Column({ nullable: true })
  faqProvider: string;

  @Column({ nullable: true })
  faqWidget: string;

  @Column({ nullable: true })
  faqSettings: string;

  @Column({ nullable: true })
  faqAnalytics: string;

  @Column({ nullable: true })
  helpCenterEnabled: boolean;

  @Column({ nullable: true })
  helpCenterProvider: string;

  @Column({ nullable: true })
  helpCenterWidget: string;

  @Column({ nullable: true })
  helpCenterSettings: string;

  @Column({ nullable: true })
  helpCenterAnalytics: string;

  @Column({ nullable: true })
  documentationEnabled: boolean;

  @Column({ nullable: true })
  documentationProvider: string;

  @Column({ nullable: true })
  documentationWidget: string;

  @Column({ nullable: true })
  documentationSettings: string;

  @Column({ nullable: true })
  documentationAnalytics: string;

  @Column({ nullable: true })
  communityEnabled: boolean;

  @Column({ nullable: true })
  communityProvider: string;

  @Column({ nullable: true })
  communityWidget: string;

  @Column({ nullable: true })
  communitySettings: string;

  @Column({ nullable: true })
  communityAnalytics: string;

  @Column({ nullable: true })
  forumEnabled: boolean;

  @Column({ nullable: true })
  forumProvider: string;

  @Column({ nullable: true })
  forumWidget: string;

  @Column({ nullable: true })
  forumSettings: string;

  @Column({ nullable: true })
  forumAnalytics: string;

  @Column({ nullable: true })
  blogEnabled: boolean;

  @Column({ nullable: true })
  blogProvider: string;

  @Column({ nullable: true })
  blogWidget: string;

  @Column({ nullable: true })
  blogSettings: string;

  @Column({ nullable: true })
  blogAnalytics: string;

  @Column({ nullable: true })
  galleryEnabled: boolean;

  @Column({ nullable: true })
  galleryProvider: string;

  @Column({ nullable: true })
  galleryWidget: string;

  @Column({ nullable: true })
  gallerySettings: string;

  @Column({ nullable: true })
  galleryAnalytics: string;

  @Column({ nullable: true })
  videoEnabled: boolean;

  @Column({ nullable: true })
  videoProvider: string;

  @Column({ nullable: true })
  videoWidget: string;

  @Column({ nullable: true })
  videoSettings: string;

  @Column({ nullable: true })
  videoAnalytics: string;

  @Column({ nullable: true })
  audioEnabled: boolean;

  @Column({ nullable: true })
  audioProvider: string;

  @Column({ nullable: true })
  audioWidget: string;

  @Column({ nullable: true })
  audioSettings: string;

  @Column({ nullable: true })
  audioAnalytics: string;

  @Column({ nullable: true })
  downloadEnabled: boolean;

  @Column({ nullable: true })
  downloadProvider: string;

  @Column({ nullable: true })
  downloadWidget: string;

  @Column({ nullable: true })
  downloadSettings: string;

  @Column({ nullable: true })
  downloadAnalytics: string;

  @Column({ nullable: true })
  uploadEnabled: boolean;

  @Column({ nullable: true })
  uploadProvider: string;

  @Column({ nullable: true })
  uploadWidget: string;

  @Column({ nullable: true })
  uploadSettings: string;

  @Column({ nullable: true })
  uploadAnalytics: string;

  @Column({ nullable: true })
  calendarEnabled: boolean;

  @Column({ nullable: true })
  calendarProvider: string;

  @Column({ nullable: true })
  calendarWidget: string;

  @Column({ nullable: true })
  calendarSettings: string;

  @Column({ nullable: true })
  calendarAnalytics: string;

  @Column({ nullable: true })
  bookingEnabled: boolean;

  @Column({ nullable: true })
  bookingProvider: string;

  @Column({ nullable: true })
  bookingWidget: string;

  @Column({ nullable: true })
  bookingSettings: string;

  @Column({ nullable: true })
  bookingAnalytics: string;

  @Column({ nullable: true })
  paymentEnabled: boolean;

  @Column({ nullable: true })
  paymentProvider: string;

  @Column({ nullable: true })
  paymentWidget: string;

  @Column({ nullable: true })
  paymentSettings: string;

  @Column({ nullable: true })
  paymentAnalytics: string;

  @Column({ nullable: true })
  donationEnabled: boolean;

  @Column({ nullable: true })
  donationProvider: string;

  @Column({ nullable: true })
  donationWidget: string;

  @Column({ nullable: true })
  donationSettings: string;

  @Column({ nullable: true })
  donationAnalytics: string;

  @Column({ nullable: true })
  subscriptionEnabled: boolean;

  @Column({ nullable: true })
  subscriptionProvider: string;

  @Column({ nullable: true })
  subscriptionWidget: string;

  @Column({ nullable: true })
  subscriptionSettings: string;

  @Column({ nullable: true })
  subscriptionAnalytics: string;

  @Column({ nullable: true })
  membershipEnabled: boolean;

  @Column({ nullable: true })
  membershipProvider: string;

  @Column({ nullable: true })
  membershipWidget: string;

  @Column({ nullable: true })
  membershipSettings: string;

  @Column({ nullable: true })
  membershipAnalytics: string;

  @Column({ nullable: true })
  loyaltyEnabled: boolean;

  @Column({ nullable: true })
  loyaltyProvider: string;

  @Column({ nullable: true })
  loyaltyWidget: string;

  @Column({ nullable: true })
  loyaltySettings: string;

  @Column({ nullable: true })
  loyaltyAnalytics: string;

  @Column({ nullable: true })
  referralEnabled: boolean;

  @Column({ nullable: true })
  referralProvider: string;

  @Column({ nullable: true })
  referralWidget: string;

  @Column({ nullable: true })
  referralSettings: string;

  @Column({ nullable: true })
  referralAnalytics: string;

  @Column({ nullable: true })
  affiliateEnabled: boolean;

  @Column({ nullable: true })
  affiliateProvider: string;

  @Column({ nullable: true })
  affiliateWidget: string;

  @Column({ nullable: true })
  affiliateSettings: string;

  @Column({ nullable: true })
  affiliateAnalytics: string;

  @Column({ nullable: true })
  partnershipEnabled: boolean;

  @Column({ nullable: true })
  partnershipProvider: string;

  @Column({ nullable: true })
  partnershipWidget: string;

  @Column({ nullable: true })
  partnershipSettings: string;

  @Column({ nullable: true })
  partnershipAnalytics: string;

  @Column({ nullable: true })
  sponsorshipEnabled: boolean;

  @Column({ nullable: true })
  sponsorshipProvider: string;

  @Column({ nullable: true })
  sponsorshipWidget: string;

  @Column({ nullable: true })
  sponsorshipSettings: string;

  @Column({ nullable: true })
  sponsorshipAnalytics: string;

  @Column({ nullable: true })
  advertisingEnabled: boolean;

  @Column({ nullable: true })
  advertisingProvider: string;

  @Column({ nullable: true })
  advertisingWidget: string;

  @Column({ nullable: true })
  advertisingSettings: string;

  @Column({ nullable: true })
  advertisingAnalytics: string;

  @Column({ nullable: true })
  marketplaceEnabled: boolean;

  @Column({ nullable: true })
  marketplaceProvider: string;

  @Column({ nullable: true })
  marketplaceWidget: string;

  @Column({ nullable: true })
  marketplaceSettings: string;

  @Column({ nullable: true })
  marketplaceAnalytics: string;

  @Column({ nullable: true })
  integrationEnabled: boolean;

  @Column({ nullable: true })
  integrationProviders: string[];

  @Column({ nullable: true })
  integrationSettings: string;

  @Column({ nullable: true })
  integrationAnalytics: string;

  @Column({ nullable: true })
  automationEnabled: boolean;

  @Column({ nullable: true })
  automationProviders: string[];

  @Column({ nullable: true })
  automationSettings: string;

  @Column({ nullable: true })
  automationAnalytics: string;

  @Column({ nullable: true })
  aiEnabled: boolean;

  @Column({ nullable: true })
  aiProviders: string[];

  @Column({ nullable: true })
  aiSettings: string;

  @Column({ nullable: true })
  aiAnalytics: string;

  @Column({ nullable: true })
  mlEnabled: boolean;

  @Column({ nullable: true })
  mlProviders: string[];

  @Column({ nullable: true })
  mlSettings: string;

  @Column({ nullable: true })
  mlAnalytics: string;

  @Column({ nullable: true })
  blockchainEnabled: boolean;

  @Column({ nullable: true })
  blockchainProviders: string[];

  @Column({ nullable: true })
  blockchainSettings: string;

  @Column({ nullable: true })
  blockchainAnalytics: string;

  @Column({ nullable: true })
  arEnabled: boolean;

  @Column({ nullable: true })
  arProviders: string[];

  @Column({ nullable: true })
  arSettings: string;

  @Column({ nullable: true })
  arAnalytics: string;

  @Column({ nullable: true })
  vrEnabled: boolean;

  @Column({ nullable: true })
  vrProviders: string[];

  @Column({ nullable: true })
  vrSettings: string;

  @Column({ nullable: true })
  vrAnalytics: string;

  @Column({ nullable: true })
  mrEnabled: boolean;

  @Column({ nullable: true })
  mrProviders: string[];

  @Column({ nullable: true })
  mrSettings: string;

  @Column({ nullable: true })
  mrAnalytics: string;

  @Column({ nullable: true })
  iotEnabled: boolean;

  @Column({ nullable: true })
  iotProviders: string[];

  @Column({ nullable: true })
  iotSettings: string;

  @Column({ nullable: true })
  iotAnalytics: string;

  @Column({ nullable: true })
  cloudEnabled: boolean;

  @Column({ nullable: true })
  cloudProviders: string[];

  @Column({ nullable: true })
  cloudSettings: string;

  @Column({ nullable: true })
  cloudAnalytics: string;

  @Column({ nullable: true })
  edgeEnabled: boolean;

  @Column({ nullable: true })
  edgeProviders: string[];

  @Column({ nullable: true })
  edgeSettings: string;

  @Column({ nullable: true })
  edgeAnalytics: string;

  @Column({ nullable: true })
  quantumEnabled: boolean;

  @Column({ nullable: true })
  quantumProviders: string[];

  @Column({ nullable: true })
  quantumSettings: string;

  @Column({ nullable: true })
  quantumAnalytics: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
