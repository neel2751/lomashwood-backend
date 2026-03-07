import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PushProvider, PushType } from '../entities/push-log.entity';

export class AndroidNotificationDto {
  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  clickAction?: string;

  @IsOptional()
  @IsString()
  bodyLocKey?: string;

  @IsOptional()
  @IsArray()
  bodyLocArgs?: string[];

  @IsOptional()
  @IsString()
  titleLocKey?: string;

  @IsOptional()
  @IsArray()
  titleLocArgs?: string[];
}

export class ApnsAlertDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  titleLocKey?: string;

  @IsOptional()
  @IsArray()
  titleLocArgs?: string[];

  @IsOptional()
  @IsString()
  bodyLocKey?: string;

  @IsOptional()
  @IsArray()
  bodyLocArgs?: string[];

  @IsOptional()
  @IsString()
  subtitleLocKey?: string;

  @IsOptional()
  @IsArray()
  subtitleLocArgs?: string[];
}

export class ApnsApsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ApnsAlertDto)
  alert?: ApnsAlertDto;

  @IsOptional()
  @IsNumber()
  badge?: number;

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsBoolean()
  contentAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  mutableContent?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsString()
  interruptionLevel?: 'passive' | 'active' | 'timeSensitive' | 'critical';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore?: number;

  @IsOptional()
  @IsString()
  targetContentId?: string;

  @IsOptional()
  @IsObject()
  criticalSound?: {
    critical?: boolean;
    name?: string;
    volume?: number;
  };

  @IsOptional()
  @IsString()
  launchImage?: string;

  @IsOptional()
  @IsString()
  mdm?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  id?: string;
}

export class ApnsPayloadDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ApnsApsDto)
  aps?: ApnsApsDto;

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}

export class WebpushActionDto {
  @IsString()
  action: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class WebpushNotificationDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsArray()
  vibrate?: number[];

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WebpushActionDto)
  actions?: WebpushActionDto[];

  @IsOptional()
  @IsBoolean()
  silent?: boolean;

  @IsOptional()
  @IsBoolean()
  requireInteraction?: boolean;

  @IsOptional()
  @IsBoolean()
  renotify?: boolean;

  @IsOptional()
  @IsBoolean()
  sticky?: boolean;

  @IsOptional()
  @IsString()
  dir?: 'auto' | 'ltr' | 'rtl';

  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @IsOptional()
  @IsString()
  image?: string;
}

export class AndroidConfigDto {
  @IsOptional()
  @IsString()
  priority?: 'high' | 'normal';

  @IsOptional()
  @IsNumber()
  @Min(0)
  ttl?: number;

  @IsOptional()
  @IsString()
  collapseKey?: string;

  @IsOptional()
  @IsString()
  restrictedPackageName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AndroidNotificationDto)
  notification?: AndroidNotificationDto;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

export class ApnsConfigDto {
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApnsPayloadDto)
  payload?: ApnsPayloadDto;
}

export class WebpushConfigDto {
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebpushNotificationDto)
  notification?: WebpushNotificationDto;
}

export class FcmOptionsDto {
  @IsOptional()
  @IsString()
  analyticsLabel?: string;
}

export class SendPushDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsObject()
  notification: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    badge?: string;
    sound?: string;
    clickAction?: string;
    tag?: string;
    color?: string;
  };

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsEnum(PushProvider)
  provider?: PushProvider;

  @IsOptional()
  @IsEnum(PushType)
  type?: PushType;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  parentPushId?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ttl?: number;

  @IsOptional()
  @IsString()
  collapseKey?: string;

  @IsOptional()
  @IsString()
  restrictedPackageName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AndroidConfigDto)
  androidConfig?: AndroidConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApnsConfigDto)
  apnsConfig?: ApnsConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebpushConfigDto)
  webpushConfig?: WebpushConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FcmOptionsDto)
  fcmOptions?: FcmOptionsDto;

  @IsOptional()
  @IsString()
  analyticsLabel?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsArray()
  webhookEvents?: string[];

  @IsOptional()
  @IsString()
  integrationId?: string;

  @IsOptional()
  @IsString()
  integrationType?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  opportunityId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsOptional()
  @IsString()
  membershipId?: string;

  @IsOptional()
  @IsString()
  loyaltyId?: string;

  @IsOptional()
  @IsString()
  rewardId?: string;

  @IsOptional()
  @IsString()
  couponId?: string;

  @IsOptional()
  @IsString()
  promotionId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  surveyId?: string;

  @IsOptional()
  @IsString()
  feedbackId?: string;

  @IsOptional()
  @IsString()
  reviewId?: string;

  @IsOptional()
  @IsString()
  ratingId?: string;

  @IsOptional()
  @IsString()
  recommendationId?: string;

  @IsOptional()
  @IsString()
  personalizationId?: string;

  @IsOptional()
  @IsString()
  aBTestId?: string;

  @IsOptional()
  @IsString()
  aBTestVariant?: string;

  @IsOptional()
  @IsString()
  experimentId?: string;

  @IsOptional()
  @IsString()
  featureFlag?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @IsOptional()
  @IsBoolean()
  canary?: boolean;

  @IsOptional()
  @IsBoolean()
  beta?: boolean;

  @IsOptional()
  @IsBoolean()
  alpha?: boolean;

  @IsOptional()
  @IsBoolean()
  internal?: boolean;

  @IsOptional()
  @IsBoolean()
  test?: boolean;

  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @IsOptional()
  @IsBoolean()
  mock?: boolean;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @IsBoolean()
  preview?: boolean;

  @IsOptional()
  @IsBoolean()
  draft?: boolean;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsString()
  segment?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  unsubscribeToken?: string;

  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @IsOptional()
  consentExpiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  gdprCompliant?: boolean;

  @IsOptional()
  @IsBoolean()
  ccpaCompliant?: boolean;

  @IsOptional()
  @IsBoolean()
  doNotDisturb?: boolean;

  @IsOptional()
  @IsString()
  doNotDisturbReason?: string;

  @IsOptional()
  @IsBoolean()
  blacklist?: boolean;

  @IsOptional()
  @IsString()
  blacklistReason?: string;

  @IsOptional()
  @IsBoolean()
  whitelist?: boolean;

  @IsOptional()
  @IsString()
  whitelistReason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  spamScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fraudScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  engagementScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  conversionScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  clickThroughRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  openRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  replyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  forwardRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  shareRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  complaintRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bounceRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  deliveryRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  successRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  billingUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  characters?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  parts?: number;

  @IsOptional()
  @IsBoolean()
  unicode?: boolean;

  @IsOptional()
  @IsBoolean()
  silent?: boolean;

  @IsOptional()
  @IsBoolean()
  contentAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  mutableContent?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsString()
  interruptionLevel?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore?: number;

  @IsOptional()
  @IsString()
  targetContentId?: string;

  @IsOptional()
  @IsObject()
  criticalSound?: any;

  @IsOptional()
  @IsString()
  launchImage?: string;

  @IsOptional()
  @IsString()
  mdm?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsObject()
  customData?: any;

  @IsOptional()
  @IsObject()
  headers?: any;

  @IsOptional()
  @IsArray()
  vibrate?: number[];

  @IsOptional()
  @IsArray()
  actions?: any[];

  @IsOptional()
  @IsBoolean()
  requireInteraction?: boolean;

  @IsOptional()
  @IsBoolean()
  renotify?: boolean;

  @IsOptional()
  @IsBoolean()
  sticky?: boolean;

  @IsOptional()
  @IsString()
  dir?: string;

  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @IsOptional()
  @IsBoolean()
  rateLimitEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRateLimit?: number;

  @IsOptional()
  @IsString()
  rateLimitWindow?: string;

  @IsOptional()
  @IsBoolean()
  throttlingEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxThrottleRate?: number;

  @IsOptional()
  @IsString()
  throttleWindow?: string;

  @IsOptional()
  @IsBoolean()
  cachingEnabled?: boolean;

  @IsOptional()
  @IsString()
  cacheTtl?: string;

  @IsOptional()
  @IsString()
  cacheKey?: string;

  @IsOptional()
  @IsBoolean()
  compressionEnabled?: boolean;

  @IsOptional()
  @IsString()
  compressionLevel?: string;

  @IsOptional()
  @IsBoolean()
  encryptionEnabled?: boolean;

  @IsOptional()
  @IsString()
  encryptionAlgorithm?: string;

  @IsOptional()
  @IsString()
  encryptionKey?: string;

  @IsOptional()
  @IsBoolean()
  signingEnabled?: boolean;

  @IsOptional()
  @IsString()
  signingAlgorithm?: string;

  @IsOptional()
  @IsString()
  signingKey?: string;

  @IsOptional()
  @IsBoolean()
  watermarkEnabled?: boolean;

  @IsOptional()
  @IsString()
  watermarkText?: string;

  @IsOptional()
  @IsString()
  watermarkImage?: string;

  @IsOptional()
  @IsBoolean()
  footerEnabled?: boolean;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  footerHtml?: string;

  @IsOptional()
  @IsBoolean()
  headerEnabled?: boolean;

  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  headerHtml?: string;

  @IsOptional()
  @IsBoolean()
  sidebarEnabled?: boolean;

  @IsOptional()
  @IsString()
  sidebarText?: string;

  @IsOptional()
  @IsString()
  sidebarHtml?: string;

  @IsOptional()
  @IsBoolean()
  cssInlining?: boolean;

  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsBoolean()
  responsiveDesign?: boolean;

  @IsOptional()
  @IsBoolean()
  mobileOptimization?: boolean;

  @IsOptional()
  @IsBoolean()
  accessibilityCompliance?: boolean;

  @IsOptional()
  @IsString()
  accessibilityLevel?: string;

  @IsOptional()
  @IsBoolean()
  gdprCompliance?: boolean;

  @IsOptional()
  @IsBoolean()
  ccpaCompliance?: boolean;

  @IsOptional()
  @IsBoolean()
  privacyPolicyLink?: boolean;

  @IsOptional()
  @IsBoolean()
  termsOfServiceLink?: boolean;

  @IsOptional()
  @IsBoolean()
  unsubscribeLink?: boolean;

  @IsOptional()
  @IsString()
  unsubscribeUrl?: string;

  @IsOptional()
  @IsBoolean()
  preferencesLink?: boolean;

  @IsOptional()
  @IsString()
  preferencesUrl?: string;

  @IsOptional()
  @IsBoolean()
  viewInBrowserLink?: boolean;

  @IsOptional()
  @IsString()
  viewInBrowserUrl?: string;

  @IsOptional()
  @IsBoolean()
  forwardToFriendLink?: boolean;

  @IsOptional()
  @IsString()
  forwardToFriendUrl?: string;

  @IsOptional()
  @IsBoolean()
  socialSharingLinks?: boolean;

  @IsOptional()
  @IsArray()
  socialPlatforms?: string[];

  @IsOptional()
  @IsBoolean()
  trackingPixel?: boolean;

  @IsOptional()
  @IsString()
  trackingPixelUrl?: string;

  @IsOptional()
  @IsBoolean()
  googleAnalytics?: boolean;

  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;

  @IsOptional()
  @IsBoolean()
  customAnalytics?: boolean;

  @IsOptional()
  @IsString()
  customAnalyticsCode?: string;

  @IsOptional()
  @IsBoolean()
  heatmaps?: boolean;

  @IsOptional()
  @IsString()
  heatmapProvider?: string;

  @IsOptional()
  @IsBoolean()
  sessionRecording?: boolean;

  @IsOptional()
  @IsString()
  sessionRecordingProvider?: string;

  @IsOptional()
  @IsBoolean()
  aBTesting?: boolean;

  @IsOptional()
  @IsString()
  aBTestingProvider?: string;

  @IsOptional()
  @IsBoolean()
  personalization?: boolean;

  @IsOptional()
  @IsString()
  personalizationProvider?: string;

  @IsOptional()
  @IsBoolean()
  dynamicContent?: boolean;

  @IsOptional()
  @IsString()
  dynamicContentProvider?: string;

  @IsOptional()
  @IsBoolean()
  conditionalContent?: boolean;

  @IsOptional()
  @IsString()
  conditionalContentRules?: string;

  @IsOptional()
  @IsBoolean()
  ampPush?: boolean;

  @IsOptional()
  @IsString()
  ampPushContent?: string;

  @IsOptional()
  @IsBoolean()
  rssFeed?: boolean;

  @IsOptional()
  @IsString()
  rssFeedUrl?: string;

  @IsOptional()
  @IsBoolean()
  xmlSitemap?: boolean;

  @IsOptional()
  @IsString()
  xmlSitemapUrl?: string;

  @IsOptional()
  @IsBoolean()
  jsonLd?: boolean;

  @IsOptional()
  @IsString()
  jsonLdData?: string;

  @IsOptional()
  @IsBoolean()
  openGraph?: boolean;

  @IsOptional()
  @IsString()
  openGraphData?: string;

  @IsOptional()
  @IsBoolean()
  twitterCards?: boolean;

  @IsOptional()
  @IsString()
  twitterCardsData?: string;

  @IsOptional()
  @IsBoolean()
  schemaMarkup?: boolean;

  @IsOptional()
  @IsString()
  schemaMarkupData?: string;

  @IsOptional()
  @IsBoolean()
  microdata?: boolean;

  @IsOptional()
  @IsString()
  microdataData?: string;

  @IsOptional()
  @IsBoolean()
  rdfa?: boolean;

  @IsOptional()
  @IsString()
  rdfaData?: string;

  @IsOptional()
  @IsBoolean()
  jsonApi?: boolean;

  @IsOptional()
  @IsString()
  jsonApiData?: string;

  @IsOptional()
  @IsBoolean()
  hal?: boolean;

  @IsOptional()
  @IsString()
  halData?: string;

  @IsOptional()
  @IsBoolean()
  siren?: boolean;

  @IsOptional()
  @IsString()
  sirenData?: string;

  @IsOptional()
  @IsBoolean()
  collectionJson?: boolean;

  @IsOptional()
  @IsString()
  collectionJsonData?: string;

  @IsOptional()
  @IsBoolean()
  jsonHome?: boolean;

  @IsOptional()
  @IsString()
  jsonHomeData?: string;

  @IsOptional()
  @IsBoolean()
  jsonActivityStreams?: boolean;

  @IsOptional()
  @IsString()
  jsonActivityStreamsData?: string;

  @IsOptional()
  @IsBoolean()
  jsonLdForRdf?: boolean;

  @IsOptional()
  @IsString()
  jsonLdForRdfData?: string;

  @IsOptional()
  @IsBoolean()
  turtle?: boolean;

  @IsOptional()
  @IsString()
  turtleData?: string;

  @IsOptional()
  @IsBoolean()
  nTriples?: boolean;

  @IsOptional()
  @IsString()
  nTriplesData?: string;

  @IsOptional()
  @IsBoolean()
  nQuads?: boolean;

  @IsOptional()
  @IsString()
  nQuadsData?: string;

  @IsOptional()
  @IsBoolean()
  trig?: boolean;

  @IsOptional()
  @IsString()
  trigData?: string;

  @IsOptional()
  @IsBoolean()
  n3?: boolean;

  @IsOptional()
  @IsString()
  n3Data?: string;

  @IsOptional()
  @IsBoolean()
  rdfXml?: boolean;

  @IsOptional()
  @IsString()
  rdfXmlData?: string;

  @IsOptional()
  @IsBoolean()
  owl?: boolean;

  @IsOptional()
  @IsString()
  owlData?: string;

  @IsOptional()
  @IsBoolean()
  rdfs?: boolean;

  @IsOptional()
  @IsString()
  rdfsData?: string;

  @IsOptional()
  @IsBoolean()
  skos?: boolean;

  @IsOptional()
  @IsString()
  skosData?: string;

  @IsOptional()
  @IsBoolean()
  shacl?: boolean;

  @IsOptional()
  @IsString()
  shaclData?: string;

  @IsOptional()
  @IsBoolean()
  sparql?: boolean;

  @IsOptional()
  @IsString()
  sparqlQuery?: string;

  @IsOptional()
  @IsBoolean()
  graphql?: boolean;

  @IsOptional()
  @IsString()
  graphqlSchema?: string;

  @IsOptional()
  @IsBoolean()
  restApi?: boolean;

  @IsOptional()
  @IsString()
  restApiDocumentation?: string;

  @IsOptional()
  @IsBoolean()
  grpc?: boolean;

  @IsOptional()
  @IsString()
  grpcProto?: string;

  @IsOptional()
  @IsBoolean()
  websocket?: boolean;

  @IsOptional()
  @IsString()
  websocketProtocol?: string;

  @IsOptional()
  @IsBoolean()
  mqtt?: boolean;

  @IsOptional()
  @IsString()
  mqttBroker?: string;

  @IsOptional()
  @IsBoolean()
  amqp?: boolean;

  @IsOptional()
  @IsString()
  amqpBroker?: string;

  @IsOptional()
  @IsBoolean()
  kafka?: boolean;

  @IsOptional()
  @IsString()
  kafkaBroker?: string;

  @IsOptional()
  @IsBoolean()
  redis?: boolean;

  @IsOptional()
  @IsString()
  redisBroker?: string;

  @IsOptional()
  @IsBoolean()
  rabbitmq?: boolean;

  @IsOptional()
  @IsString()
  rabbitmqBroker?: string;

  @IsOptional()
  @IsBoolean()
  activemq?: boolean;

  @IsOptional()
  @IsString()
  activemqBroker?: string;

  @IsOptional()
  @IsBoolean()
  zeromq?: boolean;

  @IsOptional()
  @IsString()
  zeromqBroker?: string;

  @IsOptional()
  @IsBoolean()
  nanomsg?: boolean;

  @IsOptional()
  @IsString()
  nanomsgBroker?: string;

  @IsOptional()
  @IsBoolean()
  ice?: boolean;

  @IsOptional()
  @IsString()
  iceServer?: string;

  @IsOptional()
  @IsBoolean()
  webrtc?: boolean;

  @IsOptional()
  @IsString()
  webrtcConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  websockets?: boolean;

  @IsOptional()
  @IsString()
  websocketsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  serverSentEvents?: boolean;

  @IsOptional()
  @IsString()
  serverSentEventsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  longPolling?: boolean;

  @IsOptional()
  @IsString()
  longPollingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  webhooks?: boolean;

  @IsOptional()
  @IsString()
  webhooksConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  eventSourcing?: boolean;

  @IsOptional()
  @IsString()
  eventSourcingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  cqrs?: boolean;

  @IsOptional()
  @IsString()
  cqrsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  eventStore?: boolean;

  @IsOptional()
  @IsString()
  eventStoreConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  readModel?: boolean;

  @IsOptional()
  @IsString()
  readModelConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  writeModel?: boolean;

  @IsOptional()
  @IsString()
  writeModelConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  projection?: boolean;

  @IsOptional()
  @IsString()
  projectionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  saga?: boolean;

  @IsOptional()
  @IsString()
  sagaConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  workflow?: boolean;

  @IsOptional()
  @IsString()
  workflowConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  businessProcess?: boolean;

  @IsOptional()
  @IsString()
  businessProcessConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  stateMachine?: boolean;

  @IsOptional()
  @IsString()
  stateMachineConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  rulesEngine?: boolean;

  @IsOptional()
  @IsString()
  rulesEngineConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  decisionTree?: boolean;

  @IsOptional()
  @IsString()
  decisionTreeConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  neuralNetwork?: boolean;

  @IsOptional()
  @IsString()
  neuralNetworkConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  machineLearning?: boolean;

  @IsOptional()
  @IsString()
  machineLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  deepLearning?: boolean;

  @IsOptional()
  @IsString()
  deepLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  reinforcementLearning?: boolean;

  @IsOptional()
  @IsString()
  reinforcementLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  supervisedLearning?: boolean;

  @IsOptional()
  @IsString()
  supervisedLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  unsupervisedLearning?: boolean;

  @IsOptional()
  @IsString()
  unsupervisedLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  semiSupervisedLearning?: boolean;

  @IsOptional()
  @IsString()
  semiSupervisedLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  transferLearning?: boolean;

  @IsOptional()
  @IsString()
  transferLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  federatedLearning?: boolean;

  @IsOptional()
  @IsString()
  federatedLearningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  edgeComputing?: boolean;

  @IsOptional()
  @IsString()
  edgeComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  fogComputing?: boolean;

  @IsOptional()
  @IsString()
  fogComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  cloudComputing?: boolean;

  @IsOptional()
  @IsString()
  cloudComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  hybridComputing?: boolean;

  @IsOptional()
  @IsString()
  hybridComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  distributedComputing?: boolean;

  @IsOptional()
  @IsString()
  distributedComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  parallelComputing?: boolean;

  @IsOptional()
  @IsString()
  parallelComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumComputing?: boolean;

  @IsOptional()
  @IsString()
  quantumComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  blockchain?: boolean;

  @IsOptional()
  @IsString()
  blockchainConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  smartContract?: boolean;

  @IsOptional()
  @IsString()
  smartContractConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  decentralizedFinance?: boolean;

  @IsOptional()
  @IsString()
  decentralizedFinanceConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  nonFungibleToken?: boolean;

  @IsOptional()
  @IsString()
  nonFungibleTokenConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  fungibleToken?: boolean;

  @IsOptional()
  @IsString()
  fungibleTokenConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  decentralizedApplication?: boolean;

  @IsOptional()
  @IsString()
  decentralizedApplicationConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  decentralizedAutonomousOrganization?: boolean;

  @IsOptional()
  @IsString()
  decentralizedAutonomousOrganizationConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  decentralizedStorage?: boolean;

  @IsOptional()
  @IsString()
  decentralizedStorageConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  decentralizedComputing?: boolean;

  @IsOptional()
  @IsString()
  decentralizedComputingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  decentralizedNetwork?: boolean;

  @IsOptional()
  @IsString()
  decentralizedNetworkConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  peerToPeer?: boolean;

  @IsOptional()
  @IsString()
  peerToPeerConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  distributedLedger?: boolean;

  @IsOptional()
  @IsString()
  distributedLedgerConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  consensusMechanism?: boolean;

  @IsOptional()
  @IsString()
  consensusMechanismConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfWork?: boolean;

  @IsOptional()
  @IsString()
  proofOfWorkConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfStake?: boolean;

  @IsOptional()
  @IsString()
  proofOfStakeConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfAuthority?: boolean;

  @IsOptional()
  @IsString()
  proofOfAuthorityConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfSpace?: boolean;

  @IsOptional()
  @IsString()
  proofOfSpaceConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfTime?: boolean;

  @IsOptional()
  @IsString()
  proofOfTimeConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfBurn?: boolean;

  @IsOptional()
  @IsString()
  proofOfBurnConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfCapacity?: boolean;

  @IsOptional()
  @IsString()
  proofOfCapacityConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfElapsed?: boolean;

  @IsOptional()
  @IsString()
  proofOfElapsedConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfActivity?: boolean;

  @IsOptional()
  @IsString()
  proofOfActivityConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  proofOfKnowledge?: boolean;

  @IsOptional()
  @IsString()
  proofOfKnowledgeConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  zeroKnowledgeProof?: boolean;

  @IsOptional()
  @IsString()
  zeroKnowledgeProofConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  homomorphicEncryption?: boolean;

  @IsOptional()
  @IsString()
  homomorphicEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  fullyHomomorphicEncryption?: boolean;

  @IsOptional()
  @IsString()
  fullyHomomorphicEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  somewhatHomomorphicEncryption?: boolean;

  @IsOptional()
  @IsString()
  somewhatHomomorphicEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  partiallyHomomorphicEncryption?: boolean;

  @IsOptional()
  @IsString()
  partiallyHomomorphicEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  searchableEncryption?: boolean;

  @IsOptional()
  @IsString()
  searchableEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  orderPreservingEncryption?: boolean;

  @IsOptional()
  @IsString()
  orderPreservingEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  deterministicEncryption?: boolean;

  @IsOptional()
  @IsString()
  deterministicEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  probabilisticEncryption?: boolean;

  @IsOptional()
  @IsString()
  probabilisticEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  symmetricEncryption?: boolean;

  @IsOptional()
  @IsString()
  symmetricEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  asymmetricEncryption?: boolean;

  @IsOptional()
  @IsString()
  asymmetricEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  hybridEncryption?: boolean;

  @IsOptional()
  @IsString()
  hybridEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  endToEndEncryption?: boolean;

  @IsOptional()
  @IsString()
  endToEndEncryptionConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  forwardSecrecy?: boolean;

  @IsOptional()
  @IsString()
  forwardSecrecyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  perfectForwardSecrecy?: boolean;

  @IsOptional()
  @IsString()
  perfectForwardSecrecyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  postQuantumCryptography?: boolean;

  @IsOptional()
  @IsString()
  postQuantumCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumResistantCryptography?: boolean;

  @IsOptional()
  @IsString()
  quantumResistantCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumSafeCryptography?: boolean;

  @IsOptional()
  @IsString()
  quantumSafeCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  latticeBasedCryptography?: boolean;

  @IsOptional()
  @IsString()
  latticeBasedCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  codeBasedCryptography?: boolean;

  @IsOptional()
  @IsString()
  codeBasedCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  hashBasedCryptography?: boolean;

  @IsOptional()
  @IsString()
  hashBasedCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  multivariateCryptography?: boolean;

  @IsOptional()
  @IsString()
  multivariateCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  ringCryptography?: boolean;

  @IsOptional()
  @IsString()
  ringCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  thresholdCryptography?: boolean;

  @IsOptional()
  @IsString()
  thresholdCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  secretSharingCryptography?: boolean;

  @IsOptional()
  @IsString()
  secretSharingCryptographyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  blindSignatures?: boolean;

  @IsOptional()
  @IsString()
  blindSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  groupSignatures?: boolean;

  @IsOptional()
  @IsString()
  groupSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  aggregateSignatures?: boolean;

  @IsOptional()
  @IsString()
  aggregateSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  thresholdSignatures?: boolean;

  @IsOptional()
  @IsString()
  thresholdSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  multiSignatures?: boolean;

  @IsOptional()
  @IsString()
  multiSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  ringSignatures?: boolean;

  @IsOptional()
  @IsString()
  ringSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  oneTimeSignatures?: boolean;

  @IsOptional()
  @IsString()
  oneTimeSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  oneTimePasswords?: boolean;

  @IsOptional()
  @IsString()
  oneTimePasswordsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  oneTimePads?: boolean;

  @IsOptional()
  @IsString()
  oneTimePadsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  streamCiphers?: boolean;

  @IsOptional()
  @IsString()
  streamCiphersConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  blockCiphers?: boolean;

  @IsOptional()
  @IsString()
  blockCiphersConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  hashFunctions?: boolean;

  @IsOptional()
  @IsString()
  hashFunctionsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  messageAuthenticationCodes?: boolean;

  @IsOptional()
  @IsString()
  messageAuthenticationCodesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  keyDerivationFunctions?: boolean;

  @IsOptional()
  @IsString()
  keyDerivationFunctionsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  keyExchangeProtocols?: boolean;

  @IsOptional()
  @IsString()
  keyExchangeProtocolsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  digitalSignatures?: boolean;

  @IsOptional()
  @IsString()
  digitalSignaturesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  certificates?: boolean;

  @IsOptional()
  @IsString()
  certificatesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  publicKeyInfrastructure?: boolean;

  @IsOptional()
  @IsString()
  publicKeyInfrastructureConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  certificateAuthorities?: boolean;

  @IsOptional()
  @IsString()
  certificateAuthoritiesConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  certificateRevocation?: boolean;

  @IsOptional()
  @IsString()
  certificateRevocationConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  certificateTransparency?: boolean;

  @IsOptional()
  @IsString()
  certificateTransparencyConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  certificatePinning?: boolean;

  @IsOptional()
  @IsString()
  certificatePinningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  httpPublicKeyPinning?: boolean;

  @IsOptional()
  @IsString()
  httpPublicKeyPinningConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  dnsBasedAuthentication?: boolean;

  @IsOptional()
  @IsString()
  dnsBasedAuthenticationConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  domainKeys?: boolean;

  @IsOptional()
  @IsString()
  domainKeysConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  domainMessageAuthentication?: boolean;

  @IsOptional()
  @IsString()
  domainMessageAuthenticationConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  senderPolicyFramework?: boolean;

  @IsOptional()
  @IsString()
  senderPolicyFrameworkConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  domainBasedMessageAuthentication?: boolean;

  @IsOptional()
  @IsString()
  domainBasedMessageAuthenticationConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  brandIndicators?: boolean;

  @IsOptional()
  @IsString()
  brandIndicatorsConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  messageReporting?: boolean;

  @IsOptional()
  @IsString()
  messageReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  abuseReporting?: boolean;

  @IsOptional()
  @IsString()
  abuseReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  phishingReporting?: boolean;

  @IsOptional()
  @IsString()
  phishingReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  malwareReporting?: boolean;

  @IsOptional()
  @IsString()
  malwareReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  spamReporting?: boolean;

  @IsOptional()
  @IsString()
  spamReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  virusReporting?: boolean;

  @IsOptional()
  @IsString()
  virusReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  ransomwareReporting?: boolean;

  @IsOptional()
  @IsString()
  ransomwareReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  trojanReporting?: boolean;

  @IsOptional()
  @IsString()
  trojanReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  wormReporting?: boolean;

  @IsOptional()
  @IsString()
  wormReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  botnetReporting?: boolean;

  @IsOptional()
  @IsString()
  botnetReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  ddosReporting?: boolean;

  @IsOptional()
  @IsString()
  ddosReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  dosReporting?: boolean;

  @IsOptional()
  @IsString()
  dosReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  manInTheMiddleReporting?: boolean;

  @IsOptional()
  @IsString()
  manInTheMiddleReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  replayAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  replayAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  timingAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  timingAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  sideChannelAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  sideChannelAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  faultAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  faultAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  powerAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  powerAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  electromagneticAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  electromagneticAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  acousticCryptanalysisReporting?: boolean;

  @IsOptional()
  @IsString()
  acousticCryptanalysisReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  differentialCryptanalysisReporting?: boolean;

  @IsOptional()
  @IsString()
  differentialCryptanalysisReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  linearCryptanalysisReporting?: boolean;

  @IsOptional()
  @IsString()
  linearCryptanalysisReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  integralCryptanalysisReporting?: boolean;

  @IsOptional()
  @IsString()
  integralCryptanalysisReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  meetInTheMiddleAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  meetInTheMiddleAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  birthdayAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  birthdayAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  chosenPlaintextAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  chosenPlaintextAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  chosenCiphertextAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  chosenCiphertextAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  relatedKeyAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  relatedKeyAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  knownPlaintextAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  knownPlaintextAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  knownCiphertextAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  knownCiphertextAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  ciphertextOnlyAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  ciphertextOnlyAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  adaptiveChosenPlaintextAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  adaptiveChosenPlaintextAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  adaptiveChosenCiphertextAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  adaptiveChosenCiphertextAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  boomerangAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  boomerangAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  slideAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  slideAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  relatedMessageAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  relatedMessageAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  impossibleDifferentialAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  impossibleDifferentialAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  meetInTheMiddleAttackOnProtocolsReporting?: boolean;

  @IsOptional()
  @IsString()
  meetInTheMiddleAttackOnProtocolsReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  protocolAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  protocolAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  implementationAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  implementationAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  sideChannelAttackOnImplementationReporting?: boolean;

  @IsOptional()
  @IsString()
  sideChannelAttackOnImplementationReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  timingAttackOnImplementationReporting?: boolean;

  @IsOptional()
  @IsString()
  timingAttackOnImplementationReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  powerAnalysisAttackOnImplementationReporting?: boolean;

  @IsOptional()
  @IsString()
  powerAnalysisAttackOnImplementationReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  electromagneticAnalysisAttackOnImplementationReporting?: boolean;

  @IsOptional()
  @IsString()
  electromagneticAnalysisAttackOnImplementationReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  acousticCryptanalysisOnImplementationReporting?: boolean;

  @IsOptional()
  @IsString()
  acousticCryptanalysisOnImplementationReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  differentialFaultAnalysisReporting?: boolean;

  @IsOptional()
  @IsString()
  differentialFaultAnalysisReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  faultInjectionAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  faultInjectionAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  glitchAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  glitchAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  voltageAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  voltageAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  temperatureAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  temperatureAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  lightAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  lightAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  laserAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  laserAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  electromagneticPulseAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  electromagneticPulseAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  physicalAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  physicalAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  invasiveAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  invasiveAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  nonInvasiveAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  nonInvasiveAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  semiInvasiveAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  semiInvasiveAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  reverseEngineeringAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  reverseEngineeringAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  microprobingAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  microprobingAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  faultAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  faultAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  sideChannelAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  sideChannelAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  powerAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  powerAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  electromagneticAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  electromagneticAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  timingAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  timingAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  acousticAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  acousticAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  opticalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  opticalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  thermalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  thermalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  radiationAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  radiationAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  chemicalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  chemicalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  biologicalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  biologicalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumCryptanalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumCryptanalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumSideChannelAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumSideChannelAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumFaultAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumFaultAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumTimingAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumTimingAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumPowerAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumPowerAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumElectromagneticAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumElectromagneticAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumAcousticAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumAcousticAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumOpticalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumOpticalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumThermalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumThermalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumRadiationAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumRadiationAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumChemicalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumChemicalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumBiologicalAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumBiologicalAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumNanoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumNanoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumMicroAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumMicroAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumPicoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumPicoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumFemtoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumFemtoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumAttoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumAttoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumZeptoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumZeptoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumYoctoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumYoctoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumRontoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumRontoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumYoctoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumYoctoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumZeptoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumZeptoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumAttoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumAttoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumFemtoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumFemtoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumPicoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumPicoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumNanoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumNanoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumMicroAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumMicroAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumMilliAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumMilliAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumCentiAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumCentiAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumDeciAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumDeciAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumBaseAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumBaseAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumDecaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumDecaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumHectoAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumHectoAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumKiloAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumKiloAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumMegaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumMegaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumGigaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumGigaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumTeraAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumTeraAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumPetaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumPetaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumExaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumExaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumZettaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumZettaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumYottaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumYottaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumRonnaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumRonnaAnalysisAttackReportingConfiguration?: string;

  @IsOptional()
  @IsBoolean()
  quantumQuettaAnalysisAttackReporting?: boolean;

  @IsOptional()
  @IsString()
  quantumQuettaAnalysisAttackReportingConfiguration?: string;
}
