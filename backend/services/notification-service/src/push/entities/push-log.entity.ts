import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PushStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
}

export enum PushProvider {
  FIREBASE = 'firebase',
  APNS = 'apns',
  FCM = 'fcm',
  AWS_SNS = 'aws-sns',
  AZURE_COMMUNICATION = 'azure-communication',
  ONE_SIGNAL = 'one-signal',
  URBAN_AIRSHIP = 'urban-airship',
  PUSHWOOSH = 'pushwoosh',
}

export enum PushType {
  TRANSACTIONAL = 'transactional',
  PROMOTIONAL = 'promotional',
  ALERT = 'alert',
  NOTIFICATION = 'notification',
  MARKETING = 'marketing',
  NEWSLETTER = 'newsletter',
  REMINDER = 'reminder',
  UPDATE = 'update',
}

@Entity('push_logs')
export class PushLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ type: 'json' })
  notification: any;

  @Column({ type: 'json', nullable: true })
  data?: any;

  @Column({ nullable: true })
  topic?: string;

  @Column({ nullable: true })
  condition?: string;

  @Column({
    type: 'enum',
    enum: PushProvider,
    default: PushProvider.FIREBASE,
  })
  provider: PushProvider;

  @Column({
    type: 'enum',
    enum: PushType,
    default: PushType.TRANSACTIONAL,
  })
  type: PushType;

  @Column({
    type: 'enum',
    enum: PushStatus,
    default: PushStatus.PENDING,
  })
  status: PushStatus;

  @Column({ nullable: true })
  messageId?: string;

  @Column({ nullable: true })
  errorCode?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  sentAt?: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;

  @Column({ nullable: true })
  failedAt?: Date;

  @Column({ nullable: true })
  scheduledAt?: Date;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ nullable: true })
  platform?: string;

  @Column({ nullable: true })
  deviceModel?: string;

  @Column({ nullable: true })
  appVersion?: string;

  @Column({ nullable: true })
  campaignId?: string;

  @Column({ nullable: true })
  batchId?: string;

  @Column({ nullable: true })
  correlationId?: string;

  @Column({ nullable: true })
  parentPushId?: string;

  @Column({ nullable: true })
  priority?: string;

  @Column({ nullable: true })
  ttl?: number;

  @Column({ nullable: true })
  collapseKey?: string;

  @Column({ nullable: true })
  restrictedPackageName?: string;

  @Column({ type: 'json', nullable: true })
  androidConfig?: any;

  @Column({ type: 'json', nullable: true })
  apnsConfig?: any;

  @Column({ type: 'json', nullable: true })
  webpushConfig?: any;

  @Column({ type: 'json', nullable: true })
  fcmOptions?: any;

  @Column({ nullable: true })
  analyticsLabel?: string;

  @Column({ nullable: true })
  webhookUrl?: string;

  @Column({ nullable: true })
  webhookSecret?: string;

  @Column({ type: 'json', nullable: true })
  webhookEvents?: string[];

  @Column({ nullable: true })
  integrationId?: string;

  @Column({ nullable: true })
  integrationType?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'decimal', nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  contactId?: string;

  @Column({ nullable: true })
  leadId?: string;

  @Column({ nullable: true })
  opportunityId?: string;

  @Column({ nullable: true })
  orderId?: string;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ nullable: true })
  subscriptionId?: string;

  @Column({ nullable: true })
  membershipId?: string;

  @Column({ nullable: true })
  loyaltyId?: string;

  @Column({ nullable: true })
  rewardId?: string;

  @Column({ nullable: true })
  couponId?: string;

  @Column({ nullable: true })
  promotionId?: string;

  @Column({ nullable: true })
  eventId?: string;

  @Column({ nullable: true })
  surveyId?: string;

  @Column({ nullable: true })
  feedbackId?: string;

  @Column({ nullable: true })
  reviewId?: string;

  @Column({ nullable: true })
  ratingId?: string;

  @Column({ nullable: true })
  recommendationId?: string;

  @Column({ nullable: true })
  personalizationId?: string;

  @Column({ nullable: true })
  aBTestId?: string;

  @Column({ nullable: true })
  aBTestVariant?: string;

  @Column({ nullable: true })
  experimentId?: string;

  @Column({ nullable: true })
  featureFlag?: string;

  @Column({ type: 'decimal', nullable: true })
  rolloutPercentage?: number;

  @Column({ default: false })
  canary?: boolean;

  @Column({ default: false })
  beta?: boolean;

  @Column({ default: false })
  alpha?: boolean;

  @Column({ default: false })
  internal?: boolean;

  @Column({ default: false })
  test?: boolean;

  @Column({ default: false })
  sandbox?: boolean;

  @Column({ default: false })
  mock?: boolean;

  @Column({ default: false })
  dryRun?: boolean;

  @Column({ default: false })
  preview?: boolean;

  @Column({ default: false })
  draft?: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'simple-array', nullable: true })
  categories?: string[];

  @Column({ nullable: true })
  segment?: string;

  @Column({ nullable: true })
  audience?: string;

  @Column({ nullable: true })
  purpose?: string;

  @Column({ nullable: true })
  unsubscribeToken?: string;

  @Column({ default: false })
  consentGiven?: boolean;

  @Column({ nullable: true })
  consentExpiresAt?: Date;

  @Column({ default: false })
  gdprCompliant?: boolean;

  @Column({ default: false })
  ccpaCompliant?: boolean;

  @Column({ default: false })
  doNotDisturb?: boolean;

  @Column({ nullable: true })
  doNotDisturbReason?: string;

  @Column({ default: false })
  blacklist?: boolean;

  @Column({ nullable: true })
  blacklistReason?: string;

  @Column({ default: false })
  whitelist?: boolean;

  @Column({ nullable: true })
  whitelistReason?: string;

  @Column({ type: 'decimal', nullable: true })
  spamScore?: number;

  @Column({ type: 'decimal', nullable: true })
  riskScore?: number;

  @Column({ type: 'decimal', nullable: true })
  fraudScore?: number;

  @Column({ type: 'decimal', nullable: true })
  qualityScore?: number;

  @Column({ type: 'decimal', nullable: true })
  engagementScore?: number;

  @Column({ type: 'decimal', nullable: true })
  conversionScore?: number;

  @Column({ type: 'decimal', nullable: true })
  clickThroughRate?: number;

  @Column({ type: 'decimal', nullable: true })
  openRate?: number;

  @Column({ type: 'decimal', nullable: true })
  replyRate?: number;

  @Column({ type: 'decimal', nullable: true })
  forwardRate?: number;

  @Column({ type: 'decimal', nullable: true })
  shareRate?: number;

  @Column({ type: 'decimal', nullable: true })
  complaintRate?: number;

  @Column({ type: 'decimal', nullable: true })
  bounceRate?: number;

  @Column({ type: 'decimal', nullable: true })
  deliveryRate?: number;

  @Column({ type: 'decimal', nullable: true })
  successRate?: number;

  @Column({ type: 'decimal', nullable: true })
  cost?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  billingUnit?: string;

  @Column({ nullable: true })
  characters?: number;

  @Column({ nullable: true })
  parts?: number;

  @Column({ default: false })
  unicode?: boolean;

  @Column({ default: false })
  silent?: boolean;

  @Column({ default: false })
  contentAvailable?: boolean;

  @Column({ default: false })
  mutableContent?: boolean;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  threadId?: string;

  @Column({ nullable: true })
  interruptionLevel?: string;

  @Column({ type: 'decimal', nullable: true })
  relevanceScore?: number;

  @Column({ nullable: true })
  targetContentId?: string;

  @Column({ type: 'json', nullable: true })
  criticalSound?: any;

  @Column({ nullable: true })
  launchImage?: string;

  @Column({ nullable: true })
  mdm?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ type: 'json', nullable: true })
  customData?: any;

  @Column({ type: 'json', nullable: true })
  headers?: any;

  @Column({ nullable: true })
  vibrate?: number[];

  @Column({ type: 'json', nullable: true })
  actions?: any[];

  @Column({ default: false })
  requireInteraction?: boolean;

  @Column({ default: false })
  renotify?: boolean;

  @Column({ default: false })
  sticky?: boolean;

  @Column({ nullable: true })
  dir?: string;

  @Column({ nullable: true })
  lang?: string;

  @Column({ nullable: true })
  tag?: string;

  @Column({ type: 'bigint', nullable: true })
  timestamp?: number;

  @Column({ default: false })
  rateLimitEnabled?: boolean;

  @Column({ nullable: true })
  maxRateLimit?: number;

  @Column({ nullable: true })
  rateLimitWindow?: string;

  @Column({ default: false })
  throttlingEnabled?: boolean;

  @Column({ nullable: true })
  maxThrottleRate?: number;

  @Column({ nullable: true })
  throttleWindow?: string;

  @Column({ default: false })
  cachingEnabled?: boolean;

  @Column({ nullable: true })
  cacheTtl?: string;

  @Column({ nullable: true })
  cacheKey?: string;

  @Column({ default: false })
  compressionEnabled?: boolean;

  @Column({ nullable: true })
  compressionLevel?: string;

  @Column({ default: false })
  encryptionEnabled?: boolean;

  @Column({ nullable: true })
  encryptionAlgorithm?: string;

  @Column({ nullable: true })
  encryptionKey?: string;

  @Column({ default: false })
  signingEnabled?: boolean;

  @Column({ nullable: true })
  signingAlgorithm?: string;

  @Column({ nullable: true })
  signingKey?: string;

  @Column({ default: false })
  watermarkEnabled?: boolean;

  @Column({ nullable: true })
  watermarkText?: string;

  @Column({ nullable: true })
  watermarkImage?: string;

  @Column({ default: false })
  footerEnabled?: boolean;

  @Column({ nullable: true })
  footerText?: string;

  @Column({ nullable: true })
  footerHtml?: string;

  @Column({ default: false })
  headerEnabled?: boolean;

  @Column({ nullable: true })
  headerText?: string;

  @Column({ nullable: true })
  headerHtml?: string;

  @Column({ default: false })
  sidebarEnabled?: boolean;

  @Column({ nullable: true })
  sidebarText?: string;

  @Column({ nullable: true })
  sidebarHtml?: string;

  @Column({ default: false })
  cssInlining?: boolean;

  @Column({ nullable: true })
  customCss?: string;

  @Column({ default: false })
  responsiveDesign?: boolean;

  @Column({ default: false })
  mobileOptimization?: boolean;

  @Column({ default: false })
  accessibilityCompliance?: boolean;

  @Column({ nullable: true })
  accessibilityLevel?: string;

  @Column({ default: false })
  gdprCompliance?: boolean;

  @Column({ default: false })
  ccpaCompliance?: boolean;

  @Column({ default: false })
  privacyPolicyLink?: boolean;

  @Column({ default: false })
  termsOfServiceLink?: boolean;

  @Column({ default: false })
  unsubscribeLink?: boolean;

  @Column({ nullable: true })
  unsubscribeUrl?: string;

  @Column({ default: false })
  preferencesLink?: boolean;

  @Column({ nullable: true })
  preferencesUrl?: string;

  @Column({ default: false })
  viewInBrowserLink?: boolean;

  @Column({ nullable: true })
  viewInBrowserUrl?: string;

  @Column({ default: false })
  forwardToFriendLink?: boolean;

  @Column({ nullable: true })
  forwardToFriendUrl?: string;

  @Column({ default: false })
  socialSharingLinks?: boolean;

  @Column({ type: 'simple-array', nullable: true })
  socialPlatforms?: string[];

  @Column({ default: false })
  trackingPixel?: boolean;

  @Column({ nullable: true })
  trackingPixelUrl?: string;

  @Column({ default: false })
  googleAnalytics?: boolean;

  @Column({ nullable: true })
  googleAnalyticsId?: string;

  @Column({ default: false })
  customAnalytics?: boolean;

  @Column({ nullable: true })
  customAnalyticsCode?: string;

  @Column({ default: false })
  heatmaps?: boolean;

  @Column({ nullable: true })
  heatmapProvider?: string;

  @Column({ default: false })
  sessionRecording?: boolean;

  @Column({ nullable: true })
  sessionRecordingProvider?: string;

  @Column({ default: false })
  aBTesting?: boolean;

  @Column({ nullable: true })
  aBTestingProvider?: string;

  @Column({ default: false })
  personalization?: boolean;

  @Column({ nullable: true })
  personalizationProvider?: string;

  @Column({ default: false })
  dynamicContent?: boolean;

  @Column({ nullable: true })
  dynamicContentProvider?: string;

  @Column({ default: false })
  conditionalContent?: boolean;

  @Column({ nullable: true })
  conditionalContentRules?: string;

  @Column({ default: false })
  ampPush?: boolean;

  @Column({ nullable: true })
  ampPushContent?: string;

  @Column({ default: false })
  rssFeed?: boolean;

  @Column({ nullable: true })
  rssFeedUrl?: string;

  @Column({ default: false })
  xmlSitemap?: boolean;

  @Column({ nullable: true })
  xmlSitemapUrl?: string;

  @Column({ default: false })
  jsonLd?: boolean;

  @Column({ nullable: true })
  jsonLdData?: string;

  @Column({ default: false })
  openGraph?: boolean;

  @Column({ nullable: true })
  openGraphData?: string;

  @Column({ default: false })
  twitterCards?: boolean;

  @Column({ nullable: true })
  twitterCardsData?: string;

  @Column({ default: false })
  schemaMarkup?: boolean;

  @Column({ nullable: true })
  schemaMarkupData?: string;

  @Column({ default: false })
  microdata?: boolean;

  @Column({ nullable: true })
  microdataData?: string;

  @Column({ default: false })
  rdfa?: boolean;

  @Column({ nullable: true })
  rdfaData?: string;

  @Column({ default: false })
  jsonApi?: boolean;

  @Column({ nullable: true })
  jsonApiData?: string;

  @Column({ default: false })
  hal?: boolean;

  @Column({ nullable: true })
  halData?: string;

  @Column({ default: false })
  siren?: boolean;

  @Column({ nullable: true })
  sirenData?: string;

  @Column({ default: false })
  collectionJson?: boolean;

  @Column({ nullable: true })
  collectionJsonData?: string;

  @Column({ default: false })
  jsonHome?: boolean;

  @Column({ nullable: true })
  jsonHomeData?: string;

  @Column({ default: false })
  jsonActivityStreams?: boolean;

  @Column({ nullable: true })
  jsonActivityStreamsData?: string;

  @Column({ default: false })
  jsonLdForRdf?: boolean;

  @Column({ nullable: true })
  jsonLdForRdfData?: string;

  @Column({ default: false })
  turtle?: boolean;

  @Column({ nullable: true })
  turtleData?: string;

  @Column({ default: false })
  nTriples?: boolean;

  @Column({ nullable: true })
  nTriplesData?: string;

  @Column({ default: false })
  nQuads?: boolean;

  @Column({ nullable: true })
  nQuadsData?: string;

  @Column({ default: false })
  trig?: boolean;

  @Column({ nullable: true })
  trigData?: string;

  @Column({ default: false })
  n3?: boolean;

  @Column({ nullable: true })
  n3Data?: string;

  @Column({ default: false })
  rdfXml?: boolean;

  @Column({ nullable: true })
  rdfXmlData?: string;

  @Column({ default: false })
  owl?: boolean;

  @Column({ nullable: true })
  owlData?: string;

  @Column({ default: false })
  rdfs?: boolean;

  @Column({ nullable: true })
  rdfsData?: string;

  @Column({ default: false })
  skos?: boolean;

  @Column({ nullable: true })
  skosData?: string;

  @Column({ default: false })
  shacl?: boolean;

  @Column({ nullable: true })
  shaclData?: string;

  @Column({ default: false })
  sparql?: boolean;

  @Column({ nullable: true })
  sparqlQuery?: string;

  @Column({ default: false })
  graphql?: boolean;

  @Column({ nullable: true })
  graphqlSchema?: string;

  @Column({ default: false })
  restApi?: boolean;

  @Column({ nullable: true })
  restApiDocumentation?: string;

  @Column({ default: false })
  grpc?: boolean;

  @Column({ nullable: true })
  grpcProto?: string;

  @Column({ default: false })
  websocket?: boolean;

  @Column({ nullable: true })
  websocketProtocol?: string;

  @Column({ default: false })
  mqtt?: boolean;

  @Column({ nullable: true })
  mqttBroker?: string;

  @Column({ default: false })
  amqp?: boolean;

  @Column({ nullable: true })
  amqpBroker?: string;

  @Column({ default: false })
  kafka?: boolean;

  @Column({ nullable: true })
  kafkaBroker?: string;

  @Column({ default: false })
  redis?: boolean;

  @Column({ nullable: true })
  redisBroker?: string;

  @Column({ default: false })
  rabbitmq?: boolean;

  @Column({ nullable: true })
  rabbitmqBroker?: string;

  @Column({ default: false })
  activemq?: boolean;

  @Column({ nullable: true })
  activemqBroker?: string;

  @Column({ default: false })
  zeromq?: boolean;

  @Column({ nullable: true })
  zeromqBroker?: string;

  @Column({ default: false })
  nanomsg?: boolean;

  @Column({ nullable: true })
  nanomsgBroker?: string;

  @Column({ default: false })
  ice?: boolean;

  @Column({ nullable: true })
  iceServer?: string;

  @Column({ default: false })
  webrtc?: boolean;

  @Column({ nullable: true })
  webrtcConfiguration?: string;

  @Column({ default: false })
  websockets?: boolean;

  @Column({ nullable: true })
  websocketsConfiguration?: string;

  @Column({ default: false })
  serverSentEvents?: boolean;

  @Column({ nullable: true })
  serverSentEventsConfiguration?: string;

  @Column({ default: false })
  longPolling?: boolean;

  @Column({ nullable: true })
  longPollingConfiguration?: string;

  @Column({ default: false })
  webhooks?: boolean;

  @Column({ nullable: true })
  webhooksConfiguration?: string;

  @Column({ default: false })
  eventSourcing?: boolean;

  @Column({ nullable: true })
  eventSourcingConfiguration?: string;

  @Column({ default: false })
  cqrs?: boolean;

  @Column({ nullable: true })
  cqrsConfiguration?: string;

  @Column({ default: false })
  eventStore?: boolean;

  @Column({ nullable: true })
  eventStoreConfiguration?: string;

  @Column({ default: false })
  readModel?: boolean;

  @Column({ nullable: true })
  readModelConfiguration?: string;

  @Column({ default: false })
  writeModel?: boolean;

  @Column({ nullable: true })
  writeModelConfiguration?: string;

  @Column({ default: false })
  projection?: boolean;

  @Column({ nullable: true })
  projectionConfiguration?: string;

  @Column({ default: false })
  saga?: boolean;

  @Column({ nullable: true })
  sagaConfiguration?: string;

  @Column({ default: false })
  workflow?: boolean;

  @Column({ nullable: true })
  workflowConfiguration?: string;

  @Column({ default: false })
  businessProcess?: boolean;

  @Column({ nullable: true })
  businessProcessConfiguration?: string;

  @Column({ default: false })
  stateMachine?: boolean;

  @Column({ nullable: true })
  stateMachineConfiguration?: string;

  @Column({ default: false })
  rulesEngine?: boolean;

  @Column({ nullable: true })
  rulesEngineConfiguration?: string;

  @Column({ default: false })
  decisionTree?: boolean;

  @Column({ nullable: true })
  decisionTreeConfiguration?: string;

  @Column({ default: false })
  neuralNetwork?: boolean;

  @Column({ nullable: true })
  neuralNetworkConfiguration?: string;

  @Column({ default: false })
  machineLearning?: boolean;

  @Column({ nullable: true })
  machineLearningConfiguration?: string;

  @Column({ default: false })
  deepLearning?: boolean;

  @Column({ nullable: true })
  deepLearningConfiguration?: string;

  @Column({ default: false })
  reinforcementLearning?: boolean;

  @Column({ nullable: true })
  reinforcementLearningConfiguration?: string;

  @Column({ default: false })
  supervisedLearning?: boolean;

  @Column({ nullable: true })
  supervisedLearningConfiguration?: string;

  @Column({ default: false })
  unsupervisedLearning?: boolean;

  @Column({ nullable: true })
  unsupervisedLearningConfiguration?: string;

  @Column({ default: false })
  semiSupervisedLearning?: boolean;

  @Column({ nullable: true })
  semiSupervisedLearningConfiguration?: string;

  @Column({ default: false })
  transferLearning?: boolean;

  @Column({ nullable: true })
  transferLearningConfiguration?: string;

  @Column({ default: false })
  federatedLearning?: boolean;

  @Column({ nullable: true })
  federatedLearningConfiguration?: string;

  @Column({ default: false })
  edgeComputing?: boolean;

  @Column({ nullable: true })
  edgeComputingConfiguration?: string;

  @Column({ default: false })
  fogComputing?: boolean;

  @Column({ nullable: true })
  fogComputingConfiguration?: string;

  @Column({ default: false })
  cloudComputing?: boolean;

  @Column({ nullable: true })
  cloudComputingConfiguration?: string;

  @Column({ default: false })
  hybridComputing?: boolean;

  @Column({ nullable: true })
  hybridComputingConfiguration?: string;

  @Column({ default: false })
  distributedComputing?: boolean;

  @Column({ nullable: true })
  distributedComputingConfiguration?: string;

  @Column({ default: false })
  parallelComputing?: boolean;

  @Column({ nullable: true })
  parallelComputingConfiguration?: string;

  @Column({ default: false })
  quantumComputing?: boolean;

  @Column({ nullable: true })
  quantumComputingConfiguration?: string;

  @Column({ default: false })
  blockchain?: boolean;

  @Column({ nullable: true })
  blockchainConfiguration?: string;

  @Column({ default: false })
  smartContract?: boolean;

  @Column({ nullable: true })
  smartContractConfiguration?: string;

  @Column({ default: false })
  decentralizedFinance?: boolean;

  @Column({ nullable: true })
  decentralizedFinanceConfiguration?: string;

  @Column({ default: false })
  nonFungibleToken?: boolean;

  @Column({ nullable: true })
  nonFungibleTokenConfiguration?: string;

  @Column({ default: false })
  fungibleToken?: boolean;

  @Column({ nullable: true })
  fungibleTokenConfiguration?: string;

  @Column({ default: false })
  decentralizedApplication?: boolean;

  @Column({ nullable: true })
  decentralizedApplicationConfiguration?: string;

  @Column({ default: false })
  decentralizedAutonomousOrganization?: boolean;

  @Column({ nullable: true })
  decentralizedAutonomousOrganizationConfiguration?: string;

  @Column({ default: false })
  decentralizedStorage?: boolean;

  @Column({ nullable: true })
  decentralizedStorageConfiguration?: string;

  @Column({ default: false })
  decentralizedComputing?: boolean;

  @Column({ nullable: true })
  decentralizedComputingConfiguration?: string;

  @Column({ default: false })
  decentralizedNetwork?: boolean;

  @Column({ nullable: true })
  decentralizedNetworkConfiguration?: string;

  @Column({ default: false })
  peerToPeer?: boolean;

  @Column({ nullable: true })
  peerToPeerConfiguration?: string;

  @Column({ default: false })
  distributedLedger?: boolean;

  @Column({ nullable: true })
  distributedLedgerConfiguration?: string;

  @Column({ default: false })
  consensusMechanism?: boolean;

  @Column({ nullable: true })
  consensusMechanismConfiguration?: string;

  @Column({ default: false })
  proofOfWork?: boolean;

  @Column({ nullable: true })
  proofOfWorkConfiguration?: string;

  @Column({ default: false })
  proofOfStake?: boolean;

  @Column({ nullable: true })
  proofOfStakeConfiguration?: string;

  @Column({ default: false })
  proofOfAuthority?: boolean;

  @Column({ nullable: true })
  proofOfAuthorityConfiguration?: string;

  @Column({ default: false })
  proofOfSpace?: boolean;

  @Column({ nullable: true })
  proofOfSpaceConfiguration?: string;

  @Column({ default: false })
  proofOfTime?: boolean;

  @Column({ nullable: true })
  proofOfTimeConfiguration?: string;

  @Column({ default: false })
  proofOfBurn?: boolean;

  @Column({ nullable: true })
  proofOfBurnConfiguration?: string;

  @Column({ default: false })
  proofOfCapacity?: boolean;

  @Column({ nullable: true })
  proofOfCapacityConfiguration?: string;

  @Column({ default: false })
  proofOfElapsed?: boolean;

  @Column({ nullable: true })
  proofOfElapsedConfiguration?: string;

  @Column({ default: false })
  proofOfActivity?: boolean;

  @Column({ nullable: true })
  proofOfActivityConfiguration?: string;

  @Column({ default: false })
  proofOfKnowledge?: boolean;

  @Column({ nullable: true })
  proofOfKnowledgeConfiguration?: string;

  @Column({ default: false })
  zeroKnowledgeProof?: boolean;

  @Column({ nullable: true })
  zeroKnowledgeProofConfiguration?: string;

  @Column({ default: false })
  homomorphicEncryption?: boolean;

  @Column({ nullable: true })
  homomorphicEncryptionConfiguration?: string;

  @Column({ default: false })
  fullyHomomorphicEncryption?: boolean;

  @Column({ nullable: true })
  fullyHomomorphicEncryptionConfiguration?: string;

  @Column({ default: false })
  somewhatHomomorphicEncryption?: boolean;

  @Column({ nullable: true })
  somewhatHomomorphicEncryptionConfiguration?: string;

  @Column({ default: false })
  partiallyHomomorphicEncryption?: boolean;

  @Column({ nullable: true })
  partiallyHomomorphicEncryptionConfiguration?: string;

  @Column({ default: false })
  searchableEncryption?: boolean;

  @Column({ nullable: true })
  searchableEncryptionConfiguration?: string;

  @Column({ default: false })
  orderPreservingEncryption?: boolean;

  @Column({ nullable: true })
  orderPreservingEncryptionConfiguration?: string;

  @Column({ default: false })
  deterministicEncryption?: boolean;

  @Column({ nullable: true })
  deterministicEncryptionConfiguration?: string;

  @Column({ default: false })
  probabilisticEncryption?: boolean;

  @Column({ nullable: true })
  probabilisticEncryptionConfiguration?: string;

  @Column({ default: false })
  symmetricEncryption?: boolean;

  @Column({ nullable: true })
  symmetricEncryptionConfiguration?: string;

  @Column({ default: false })
  asymmetricEncryption?: boolean;

  @Column({ nullable: true })
  asymmetricEncryptionConfiguration?: string;

  @Column({ default: false })
  hybridEncryption?: boolean;

  @Column({ nullable: true })
  hybridEncryptionConfiguration?: string;

  @Column({ default: false })
  endToEndEncryption?: boolean;

  @Column({ nullable: true })
  endToEndEncryptionConfiguration?: string;

  @Column({ default: false })
  forwardSecrecy?: boolean;

  @Column({ nullable: true })
  forwardSecrecyConfiguration?: string;

  @Column({ default: false })
  perfectForwardSecrecy?: boolean;

  @Column({ nullable: true })
  perfectForwardSecrecyConfiguration?: string;

  @Column({ default: false })
  postQuantumCryptography?: boolean;

  @Column({ nullable: true })
  postQuantumCryptographyConfiguration?: string;

  @Column({ default: false })
  quantumResistantCryptography?: boolean;

  @Column({ nullable: true })
  quantumResistantCryptographyConfiguration?: string;

  @Column({ default: false })
  quantumSafeCryptography?: boolean;

  @Column({ nullable: true })
  quantumSafeCryptographyConfiguration?: string;

  @Column({ default: false })
  latticeBasedCryptography?: boolean;

  @Column({ nullable: true })
  latticeBasedCryptographyConfiguration?: string;

  @Column({ default: false })
  codeBasedCryptography?: boolean;

  @Column({ nullable: true })
  codeBasedCryptographyConfiguration?: string;

  @Column({ default: false })
  hashBasedCryptography?: boolean;

  @Column({ nullable: true })
  hashBasedCryptographyConfiguration?: string;

  @Column({ default: false })
  multivariateCryptography?: boolean;

  @Column({ nullable: true })
  multivariateCryptographyConfiguration?: string;

  @Column({ default: false })
  ringCryptography?: boolean;

  @Column({ nullable: true })
  ringCryptographyConfiguration?: string;

  @Column({ default: false })
  thresholdCryptography?: boolean;

  @Column({ nullable: true })
  thresholdCryptographyConfiguration?: string;

  @Column({ default: false })
  secretSharingCryptography?: boolean;

  @Column({ nullable: true })
  secretSharingCryptographyConfiguration?: string;

  @Column({ default: false })
  blindSignatures?: boolean;

  @Column({ nullable: true })
  blindSignaturesConfiguration?: string;

  @Column({ default: false })
  groupSignatures?: boolean;

  @Column({ nullable: true })
  groupSignaturesConfiguration?: string;

  @Column({ default: false })
  aggregateSignatures?: boolean;

  @Column({ nullable: true })
  aggregateSignaturesConfiguration?: string;

  @Column({ default: false })
  thresholdSignatures?: boolean;

  @Column({ nullable: true })
  thresholdSignaturesConfiguration?: string;

  @Column({ default: false })
  multiSignatures?: boolean;

  @Column({ nullable: true })
  multiSignaturesConfiguration?: string;

  @Column({ default: false })
  ringSignatures?: boolean;

  @Column({ nullable: true })
  ringSignaturesConfiguration?: string;

  @Column({ default: false })
  oneTimeSignatures?: boolean;

  @Column({ nullable: true })
  oneTimeSignaturesConfiguration?: string;

  @Column({ default: false })
  oneTimePasswords?: boolean;

  @Column({ nullable: true })
  oneTimePasswordsConfiguration?: string;

  @Column({ default: false })
  oneTimePads?: boolean;

  @Column({ nullable: true })
  oneTimePadsConfiguration?: string;

  @Column({ default: false })
  streamCiphers?: boolean;

  @Column({ nullable: true })
  streamCiphersConfiguration?: string;

  @Column({ default: false })
  blockCiphers?: boolean;

  @Column({ nullable: true })
  blockCiphersConfiguration?: string;

  @Column({ default: false })
  hashFunctions?: boolean;

  @Column({ nullable: true })
  hashFunctionsConfiguration?: string;

  @Column({ default: false })
  messageAuthenticationCodes?: boolean;

  @Column({ nullable: true })
  messageAuthenticationCodesConfiguration?: string;

  @Column({ default: false })
  keyDerivationFunctions?: boolean;

  @Column({ nullable: true })
  keyDerivationFunctionsConfiguration?: string;

  @Column({ default: false })
  keyExchangeProtocols?: boolean;

  @Column({ nullable: true })
  keyExchangeProtocolsConfiguration?: string;

  @Column({ default: false })
  digitalSignatures?: boolean;

  @Column({ nullable: true })
  digitalSignaturesConfiguration?: string;

  @Column({ default: false })
  certificates?: boolean;

  @Column({ nullable: true })
  certificatesConfiguration?: string;

  @Column({ default: false })
  publicKeyInfrastructure?: boolean;

  @Column({ nullable: true })
  publicKeyInfrastructureConfiguration?: string;

  @Column({ default: false })
  certificateAuthorities?: boolean;

  @Column({ nullable: true })
  certificateAuthoritiesConfiguration?: string;

  @Column({ default: false })
  certificateRevocation?: boolean;

  @Column({ nullable: true })
  certificateRevocationConfiguration?: string;

  @Column({ default: false })
  certificateTransparency?: boolean;

  @Column({ nullable: true })
  certificateTransparencyConfiguration?: string;

  @Column({ default: false })
  certificatePinning?: boolean;

  @Column({ nullable: true })
  certificatePinningConfiguration?: string;

  @Column({ default: false })
  httpPublicKeyPinning?: boolean;

  @Column({ nullable: true })
  httpPublicKeyPinningConfiguration?: string;

  @Column({ default: false })
  dnsBasedAuthentication?: boolean;

  @Column({ nullable: true })
  dnsBasedAuthenticationConfiguration?: string;

  @Column({ default: false })
  domainKeys?: boolean;

  @Column({ nullable: true })
  domainKeysConfiguration?: string;

  @Column({ default: false })
  domainMessageAuthentication?: boolean;

  @Column({ nullable: true })
  domainMessageAuthenticationConfiguration?: string;

  @Column({ default: false })
  senderPolicyFramework?: boolean;

  @Column({ nullable: true })
  senderPolicyFrameworkConfiguration?: string;

  @Column({ default: false })
  domainBasedMessageAuthentication?: boolean;

  @Column({ nullable: true })
  domainBasedMessageAuthenticationConfiguration?: string;

  @Column({ default: false })
  brandIndicators?: boolean;

  @Column({ nullable: true })
  brandIndicatorsConfiguration?: string;

  @Column({ default: false })
  messageReporting?: boolean;

  @Column({ nullable: true })
  messageReportingConfiguration?: string;

  @Column({ default: false })
  abuseReporting?: boolean;

  @Column({ nullable: true })
  abuseReportingConfiguration?: string;

  @Column({ default: false })
  phishingReporting?: boolean;

  @Column({ nullable: true })
  phishingReportingConfiguration?: string;

  @Column({ default: false })
  malwareReporting?: boolean;

  @Column({ nullable: true })
  malwareReportingConfiguration?: string;

  @Column({ default: false })
  spamReporting?: boolean;

  @Column({ nullable: true })
  spamReportingConfiguration?: string;

  @Column({ default: false })
  virusReporting?: boolean;

  @Column({ nullable: true })
  virusReportingConfiguration?: string;

  @Column({ default: false })
  ransomwareReporting?: boolean;

  @Column({ nullable: true })
  ransomwareReportingConfiguration?: string;

  @Column({ default: false })
  trojanReporting?: boolean;

  @Column({ nullable: true })
  trojanReportingConfiguration?: string;

  @Column({ default: false })
  wormReporting?: boolean;

  @Column({ nullable: true })
  wormReportingConfiguration?: string;

  @Column({ default: false })
  botnetReporting?: boolean;

  @Column({ nullable: true })
  botnetReportingConfiguration?: string;

  @Column({ default: false })
  ddosReporting?: boolean;

  @Column({ nullable: true })
  ddosReportingConfiguration?: string;

  @Column({ default: false })
  dosReporting?: boolean;

  @Column({ nullable: true })
  dosReportingConfiguration?: string;

  @Column({ default: false })
  manInTheMiddleReporting?: boolean;

  @Column({ nullable: true })
  manInTheMiddleReportingConfiguration?: string;

  @Column({ default: false })
  replayAttackReporting?: boolean;

  @Column({ nullable: true })
  replayAttackReportingConfiguration?: string;

  @Column({ default: false })
  timingAttackReporting?: boolean;

  @Column({ nullable: true })
  timingAttackReportingConfiguration?: string;

  @Column({ default: false })
  sideChannelAttackReporting?: boolean;

  @Column({ nullable: true })
  sideChannelAttackReportingConfiguration?: string;

  @Column({ default: false })
  faultAttackReporting?: boolean;

  @Column({ nullable: true })
  faultAttackReportingConfiguration?: string;

  @Column({ default: false })
  powerAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  powerAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  electromagneticAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  electromagneticAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  acousticCryptanalysisReporting?: boolean;

  @Column({ nullable: true })
  acousticCryptanalysisReportingConfiguration?: string;

  @Column({ default: false })
  differentialCryptanalysisReporting?: boolean;

  @Column({ nullable: true })
  differentialCryptanalysisReportingConfiguration?: string;

  @Column({ default: false })
  linearCryptanalysisReporting?: boolean;

  @Column({ nullable: true })
  linearCryptanalysisReportingConfiguration?: string;

  @Column({ default: false })
  integralCryptanalysisReporting?: boolean;

  @Column({ nullable: true })
  integralCryptanalysisReportingConfiguration?: string;

  @Column({ default: false })
  meetInTheMiddleAttackReporting?: boolean;

  @Column({ nullable: true })
  meetInTheMiddleAttackReportingConfiguration?: string;

  @Column({ default: false })
  birthdayAttackReporting?: boolean;

  @Column({ nullable: true })
  birthdayAttackReportingConfiguration?: string;

  @Column({ default: false })
  chosenPlaintextAttackReporting?: boolean;

  @Column({ nullable: true })
  chosenPlaintextAttackReportingConfiguration?: string;

  @Column({ default: false })
  chosenCiphertextAttackReporting?: boolean;

  @Column({ nullable: true })
  chosenCiphertextAttackReportingConfiguration?: string;

  @Column({ default: false })
  relatedKeyAttackReporting?: boolean;

  @Column({ nullable: true })
  relatedKeyAttackReportingConfiguration?: string;

  @Column({ default: false })
  knownPlaintextAttackReporting?: boolean;

  @Column({ nullable: true })
  knownPlaintextAttackReportingConfiguration?: string;

  @Column({ default: false })
  knownCiphertextAttackReporting?: boolean;

  @Column({ nullable: true })
  knownCiphertextAttackReportingConfiguration?: string;

  @Column({ default: false })
  ciphertextOnlyAttackReporting?: boolean;

  @Column({ nullable: true })
  ciphertextOnlyAttackReportingConfiguration?: string;

  @Column({ default: false })
  adaptiveChosenPlaintextAttackReporting?: boolean;

  @Column({ nullable: true })
  adaptiveChosenPlaintextAttackReportingConfiguration?: string;

  @Column({ default: false })
  adaptiveChosenCiphertextAttackReporting?: boolean;

  @Column({ nullable: true })
  adaptiveChosenCiphertextAttackReportingConfiguration?: string;

  @Column({ default: false })
  boomerangAttackReporting?: boolean;

  @Column({ nullable: true })
  boomerangAttackReportingConfiguration?: string;

  @Column({ default: false })
  slideAttackReporting?: boolean;

  @Column({ nullable: true })
  slideAttackReportingConfiguration?: string;

  @Column({ default: false })
  relatedMessageAttackReporting?: boolean;

  @Column({ nullable: true })
  relatedMessageAttackReportingConfiguration?: string;

  @Column({ default: false })
  impossibleDifferentialAttackReporting?: boolean;

  @Column({ nullable: true })
  impossibleDifferentialAttackReportingConfiguration?: string;

  @Column({ default: false })
  meetInTheMiddleAttackOnProtocolsReporting?: boolean;

  @Column({ nullable: true })
  meetInTheMiddleAttackOnProtocolsReportingConfiguration?: string;

  @Column({ default: false })
  protocolAttackReporting?: boolean;

  @Column({ nullable: true })
  protocolAttackReportingConfiguration?: string;

  @Column({ default: false })
  implementationAttackReporting?: boolean;

  @Column({ nullable: true })
  implementationAttackReportingConfiguration?: string;

  @Column({ default: false })
  sideChannelAttackOnImplementationReporting?: boolean;

  @Column({ nullable: true })
  sideChannelAttackOnImplementationReportingConfiguration?: string;

  @Column({ default: false })
  timingAttackOnImplementationReporting?: boolean;

  @Column({ nullable: true })
  timingAttackOnImplementationReportingConfiguration?: string;

  @Column({ default: false })
  powerAnalysisAttackOnImplementationReporting?: boolean;

  @Column({ nullable: true })
  powerAnalysisAttackOnImplementationReportingConfiguration?: string;

  @Column({ default: false })
  electromagneticAnalysisAttackOnImplementationReporting?: boolean;

  @Column({ nullable: true })
  electromagneticAnalysisAttackOnImplementationReportingConfiguration?: string;

  @Column({ default: false })
  acousticCryptanalysisOnImplementationReporting?: boolean;

  @Column({ nullable: true })
  acousticCryptanalysisOnImplementationReportingConfiguration?: string;

  @Column({ default: false })
  differentialFaultAnalysisReporting?: boolean;

  @Column({ nullable: true })
  differentialFaultAnalysisReportingConfiguration?: string;

  @Column({ default: false })
  faultInjectionAttackReporting?: boolean;

  @Column({ nullable: true })
  faultInjectionAttackReportingConfiguration?: string;

  @Column({ default: false })
  glitchAttackReporting?: boolean;

  @Column({ nullable: true })
  glitchAttackReportingConfiguration?: string;

  @Column({ default: false })
  voltageAttackReporting?: boolean;

  @Column({ nullable: true })
  voltageAttackReportingConfiguration?: string;

  @Column({ default: false })
  temperatureAttackReporting?: boolean;

  @Column({ nullable: true })
  temperatureAttackReportingConfiguration?: string;

  @Column({ default: false })
  lightAttackReporting?: boolean;

  @Column({ nullable: true })
  lightAttackReportingConfiguration?: string;

  @Column({ default: false })
  laserAttackReporting?: boolean;

  @Column({ nullable: true })
  laserAttackReportingConfiguration?: string;

  @Column({ default: false })
  electromagneticPulseAttackReporting?: boolean;

  @Column({ nullable: true })
  electromagneticPulseAttackReportingConfiguration?: string;

  @Column({ default: false })
  physicalAttackReporting?: boolean;

  @Column({ nullable: true })
  physicalAttackReportingConfiguration?: string;

  @Column({ default: false })
  invasiveAttackReporting?: boolean;

  @Column({ nullable: true })
  invasiveAttackReportingConfiguration?: string;

  @Column({ default: false })
  nonInvasiveAttackReporting?: boolean;

  @Column({ nullable: true })
  nonInvasiveAttackReportingConfiguration?: string;

  @Column({ default: false })
  semiInvasiveAttackReporting?: boolean;

  @Column({ nullable: true })
  semiInvasiveAttackReportingConfiguration?: string;

  @Column({ default: false })
  reverseEngineeringAttackReporting?: boolean;

  @Column({ nullable: true })
  reverseEngineeringAttackReportingConfiguration?: string;

  @Column({ default: false })
  microprobingAttackReporting?: boolean;

  @Column({ nullable: true })
  microprobingAttackReportingConfiguration?: string;

  @Column({ default: false })
  faultAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  faultAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  sideChannelAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  sideChannelAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  powerAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  powerAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  electromagneticAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  electromagneticAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  timingAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  timingAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  acousticAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  acousticAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  opticalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  opticalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  thermalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  thermalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  radiationAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  radiationAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  chemicalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  chemicalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  biologicalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  biologicalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumCryptanalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumCryptanalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumSideChannelAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumSideChannelAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumFaultAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumFaultAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumTimingAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumTimingAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumPowerAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumPowerAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumElectromagneticAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumElectromagneticAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumAcousticAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumAcousticAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumOpticalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumOpticalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumThermalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumThermalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumRadiationAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumRadiationAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumChemicalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumChemicalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumBiologicalAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumBiologicalAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumNanoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumNanoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumMicroAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumMicroAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumPicoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumPicoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumFemtoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumFemtoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumAttoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumAttoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumZeptoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumZeptoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumYoctoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumYoctoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumRontoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumRontoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumYoctoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumYoctoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumZeptoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumZeptoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumAttoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumAttoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumFemtoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumFemtoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumPicoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumPicoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumNanoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumNanoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumMicroAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumMicroAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumMilliAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumMilliAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumCentiAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumCentiAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumDeciAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumDeciAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumBaseAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumBaseAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumDecaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumDecaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumHectoAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumHectoAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumKiloAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumKiloAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumMegaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumMegaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumGigaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumGigaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumTeraAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumTeraAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumPetaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumPetaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumExaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumExaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumZettaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumZettaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumYottaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumYottaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumRonnaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumRonnaAnalysisAttackReportingConfiguration?: string;

  @Column({ default: false })
  quantumQuettaAnalysisAttackReporting?: boolean;

  @Column({ nullable: true })
  quantumQuettaAnalysisAttackReportingConfiguration?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
