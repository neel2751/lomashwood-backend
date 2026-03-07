import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SeoStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ChangeFrequency {
  ALWAYS = 'always',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  NEVER = 'never',
}

@Entity('seo_meta')
export class SeoMeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string; // Product, Blog, Page, Category, etc.

  @Column()
  entityId: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  keywords: string[];

  @Column({ nullable: true })
  canonicalUrl: string;

  @Column({
    type: 'enum',
    enum: SeoStatus,
    default: SeoStatus.ACTIVE,
  })
  status: SeoStatus;

  @Column({ nullable: true })
  priority: number; // 0.0 to 1.0

  @Column({
    type: 'enum',
    enum: ChangeFrequency,
    default: ChangeFrequency.WEEKLY,
  })
  changeFrequency: ChangeFrequency;

  @Column({ nullable: true })
  openGraph: string; // JSON string with Open Graph data

  @Column({ nullable: true })
  twitterCard: string; // JSON string with Twitter Card data

  @Column({ nullable: true })
  schemaMarkup: string; // JSON string with structured data

  @Column({ nullable: true })
  images: string[]; // Array of image URLs with metadata

  @Column({ nullable: true })
  videos: string[]; // Array of video URLs with metadata

  @Column({ nullable: true })
  audio: string[]; // Array of audio URLs with metadata

  @Column({ nullable: true })
  alternateUrls: string[]; // Array of alternate language URLs

  @Column({ nullable: true })
  hreflang: string[]; // Array of language codes

  @Column({ nullable: true })
  noIndex: boolean;

  @Column({ nullable: true })
  noFollow: boolean;

  @Column({ nullable: true })
  noArchive: boolean;

  @Column({ nullable: true })
  noSnippet: boolean;

  @Column({ nullable: true })
  noImageIndex: boolean;

  @Column({ nullable: true })
  noTranslate: boolean;

  @Column({ nullable: true })
  maxSnippet: number;

  @Column({ nullable: true })
  maxImagePreview: string;

  @Column({ nullable: true })
  maxVideoPreview: string;

  @Column({ nullable: true })
  pageMap: boolean;

  @Column({ nullable: true })
  newsKeywords: string[];

  @Column({ nullable: true })
  newsStandout: boolean;

  @Column({ nullable: true })
  newsPublication: string;

  @Column({ nullable: true })
  newsPublicationDate: Date;

  @Column({ nullable: true })
  newsTitle: string;

  @Column({ nullable: true })
  newsAuthor: string;

  @Column({ nullable: true })
  newsGenre: string[];

  @Column({ nullable: true })
  newsStockTickers: string[];

  @Column({ nullable: true })
  recipeName: string;

  @Column({ nullable: true })
  recipeDescription: string;

  @Column({ nullable: true })
  recipeImage: string;

  @Column({ nullable: true })
  recipeIngredients: string[];

  @Column({ nullable: true })
  recipeInstructions: string[];

  @Column({ nullable: true })
  recipePrepTime: string;

  @Column({ nullable: true })
  recipeCookTime: string;

  @Column({ nullable: true })
  recipeTotalTime: string;

  @Column({ nullable: true })
  recipeYield: string;

  @Column({ nullable: true })
  recipeCategory: string;

  @Column({ nullable: true })
  recipeCuisine: string;

  @Column({ nullable: true })
  recipeNutrition: string;

  @Column({ nullable: true })
  recipeRating: number;

  @Column({ nullable: true })
  recipeReviewCount: number;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  productDescription: string;

  @Column({ nullable: true })
  productImage: string;

  @Column({ nullable: true })
  productBrand: string;

  @Column({ nullable: true })
  productSku: string;

  @Column({ nullable: true })
  productGtin: string;

  @Column({ nullable: true })
  productPrice: number;

  @Column({ nullable: true })
  productCurrency: string;

  @Column({ nullable: true })
  productAvailability: string;

  @Column({ nullable: true })
  productCondition: string;

  @Column({ nullable: true })
  productRating: number;

  @Column({ nullable: true })
  productReviewCount: number;

  @Column({ nullable: true })
  productSeller: string;

  @Column({ nullable: true })
  productShipping: string;

  @Column({ nullable: true })
  productReturnPolicy: string;

  @Column({ nullable: true })
  productWarranty: string;

  @Column({ nullable: true })
  productMaterial: string[];

  @Column({ nullable: true })
  productColor: string[];

  @Column({ nullable: true })
  productSize: string[];

  @Column({ nullable: true })
  productWeight: string;

  @Column({ nullable: true })
  productDimensions: string;

  @Column({ nullable: true })
  productOrigin: string;

  @Column({ nullable: true })
  productCertifications: string[];

  @Column({ nullable: true })
  productEcoFriendly: boolean;

  @Column({ nullable: true })
  productOrganic: boolean;

  @Column({ nullable: true })
  productFairTrade: boolean;

  @Column({ nullable: true })
  productHandmade: boolean;

  @Column({ nullable: true })
  productCustomizable: boolean;

  @Column({ nullable: true })
  productLimitedEdition: boolean;

  @Column({ nullable: true })
  productExclusive: boolean;

  @Column({ nullable: true })
  productNewArrival: boolean;

  @Column({ nullable: true })
  productBestSeller: boolean;

  @Column({ nullable: true })
  productSale: boolean;

  @Column({ nullable: true })
  productDiscount: number;

  @Column({ nullable: true })
  productDiscountType: string;

  @Column({ nullable: true })
  productDiscountValidUntil: Date;

  @Column({ nullable: true })
  productRelatedItems: string[];

  @Column({ nullable: true })
  productAccessories: string[];

  @Column({ nullable: true })
  productVariants: string[];

  @Column({ nullable: true })
  productCustomFields: string;

  @Column({ nullable: true })
  productSeoScore: number;

  @Column({ nullable: true })
  productSeoRecommendations: string[];

  @Column({ nullable: true })
  articleTitle: string;

  @Column({ nullable: true })
  articleDescription: string;

  @Column({ nullable: true })
  articleImage: string;

  @Column({ nullable: true })
  articleAuthor: string;

  @Column({ nullable: true })
  articleAuthorUrl: string;

  @Column({ nullable: true })
  articlePublisher: string;

  @Column({ nullable: true })
  articlePublisherUrl: string;

  @Column({ nullable: true })
  articlePublishedAt: Date;

  @Column({ nullable: true })
  articleModifiedAt: Date;

  @Column({ nullable: true })
  articleCategory: string;

  @Column({ nullable: true })
  articleTags: string[];

  @Column({ nullable: true })
  articleWordCount: number;

  @Column({ nullable: true })
  articleReadingTime: number;

  @Column({ nullable: true })
  articleDifficulty: string;

  @Column({ nullable: true })
  articleLanguage: string;

  @Column({ nullable: true })
  articleRegion: string;

  @Column({ nullable: true })
  articleAudience: string[];

  @Column({ nullable: true })
  articleTopics: string[];

  @Column({ nullable: true })
  articleExpertiseLevel: string;

  @Column({ nullable: true })
  articleFactChecked: boolean;

  @Column({ nullable: true })
  articleFactChecker: string;

  @Column({ nullable: true })
  articleFactCheckDate: Date;

  @Column({ nullable: true })
  articleFactCheckRating: string;

  @Column({ nullable: true })
  articleFactCheckNotes: string;

  @Column({ nullable: true })
  articleSponsored: boolean;

  @Column({ nullable: true })
  articleSponsor: string;

  @Column({ nullable: true })
  articleSponsorUrl: string;

  @Column({ nullable: true })
  articleAffiliateLinks: string[];

  @Column({ nullable: true })
  articleMonetized: boolean;

  @Column({ nullable: true })
  articleAdNetworks: string[];

  @Column({ nullable: true })
  articleAdPlacement: string[];

  @Column({ nullable: true })
  articleAdFrequency: string;

  @Column({ nullable: true })
  articleAdDensity: number;

  @Column({ nullable: true })
  articleAdRevenue: number;

  @Column({ nullable: true })
  articleSeoScore: number;

  @Column({ nullable: true })
  articleSeoRecommendations: string[];

  @Column({ nullable: true })
  localBusinessName: string;

  @Column({ nullable: true })
  localBusinessDescription: string;

  @Column({ nullable: true })
  localBusinessImage: string;

  @Column({ nullable: true })
  localBusinessAddress: string;

  @Column({ nullable: true })
  localBusinessCity: string;

  @Column({ nullable: true })
  localBusinessState: string;

  @Column({ nullable: true })
  localBusinessZip: string;

  @Column({ nullable: true })
  localBusinessCountry: string;

  @Column({ nullable: true })
  localBusinessPhone: string;

  @Column({ nullable: true })
  localBusinessEmail: string;

  @Column({ nullable: true })
  localBusinessWebsite: string;

  @Column({ nullable: true })
  localBusinessHours: string;

  @Column({ nullable: true })
  localBusinessPriceRange: string;

  @Column({ nullable: true })
  localBusinessPaymentMethods: string[];

  @Column({ nullable: true })
  localBusinessDelivery: boolean;

  @Column({ nullable: true })
  localBusinessPickup: boolean;

  @Column({ nullable: true })
  localBusinessShipping: boolean;

  @Column({ nullable: true })
  localBusinessServiceArea: string[];

  @Column({ nullable: true })
  localBusinessLanguages: string[];

  @Column({ nullable: true })
  localBusinessAccessibility: string[];

  @Column({ nullable: true })
  localBusinessParking: string[];

  @Column({ nullable: true })
  localBusinessWifi: boolean;

  @Column({ nullable: true })
  localBusinessOutdoorSeating: boolean;

  @Column({ nullable: true })
  localBusinessReservations: boolean;

  @Column({ nullable: true })
  localBusinessTakeout: boolean;

  @Column({ nullable: true })
  localBusinessDeliveryFee: number;

  @Column({ nullable: true })
  localBusinessMinimumOrder: number;

  @Column({ nullable: true })
  localBusinessDeliveryTime: string;

  @Column({ nullable: true })
  localBusinessRating: number;

  @Column({ nullable: true })
  localBusinessReviewCount: number;

  @Column({ nullable: true })
  localBusinessReviews: string[];

  @Column({ nullable: true })
  localBusinessAwards: string[];

  @Column({ nullable: true })
  localBusinessCertifications: string[];

  @Column({ nullable: true })
  localBusinessMemberships: string[];

  @Column({ nullable: true })
  localBusinessFounded: Date;

  @Column({ nullable: true })
  localBusinessEmployees: number;

  @Column({ nullable: true })
  localBusinessRevenue: number;

  @Column({ nullable: true })
  localBusinessSeoScore: number;

  @Column({ nullable: true })
  localBusinessSeoRecommendations: string[];

  @Column({ nullable: true })
  customMeta: string; // JSON string for custom metadata

  @Column({ nullable: true })
  trackingPixels: string[];

  @Column({ nullable: true })
  analyticsScripts: string[];

  @Column({ nullable: true })
  conversionTracking: string;

  @Column({ nullable: true })
  heatmaps: boolean;

  @Column({ nullable: true })
  sessionRecording: boolean;

  @Column({ nullable: true })
  aBTesting: boolean;

  @Column({ nullable: true })
  personalization: boolean;

  @Column({ nullable: true })
  localization: boolean;

  @Column({ nullable: true })
  internationalization: boolean;

  @Column({ nullable: true })
  accessibility: boolean;

  @Column({ nullable: true })
  performance: boolean;

  @Column({ nullable: true })
  security: boolean;

  @Column({ nullable: true })
  privacy: boolean;

  @Column({ nullable: true })
  gdpr: boolean;

  @Column({ nullable: true })
  ccpa: boolean;

  @Column({ nullable: true })
  cookieConsent: boolean;

  @Column({ nullable: true })
  dataProcessing: string;

  @Column({ nullable: true })
  dataRetention: number;

  @Column({ nullable: true })
  dataDeletion: boolean;

  @Column({ nullable: true })
  dataPortability: boolean;

  @Column({ nullable: true })
  dataCorrection: boolean;

  @Column({ nullable: true })
  dataAccess: boolean;

  @Column({ nullable: true })
  dataOptOut: boolean;

  @Column({ nullable: true })
  dataMarketing: boolean;

  @Column({ nullable: true })
  dataAnalytics: boolean;

  @Column({ nullable: true })
  dataAdvertising: boolean;

  @Column({ nullable: true })
  dataThirdParty: boolean;

  @Column({ nullable: true })
  dataFirstParty: boolean;

  @Column({ nullable: true })
  dataCookies: boolean;

  @Column({ nullable: true })
  dataLocalStorage: boolean;

  @Column({ nullable: true })
  dataSessionStorage: boolean;

  @Column({ nullable: true })
  dataIndexedDB: boolean;

  @Column({ nullable: true })
  dataWebSQL: boolean;

  @Column({ nullable: true })
  dataFileSystem: boolean;

  @Column({ nullable: true })
  dataCache: boolean;

  @Column({ nullable: true })
  dataServiceWorker: boolean;

  @Column({ nullable: true })
  dataWebAssembly: boolean;

  @Column({ nullable: true })
  dataWebGL: boolean;

  @Column({ nullable: true })
  dataWebRTC: boolean;

  @Column({ nullable: true })
  dataWebSocket: boolean;

  @Column({ nullable: true })
  dataWebAudio: boolean;

  @Column({ nullable: true })
  dataWebVR: boolean;

  @Column({ nullable: true })
  dataWebAR: boolean;

  @Column({ nullable: true })
  dataWebXR: boolean;

  @Column({ nullable: true })
  dataWebBluetooth: boolean;

  @Column({ nullable: true })
  dataWebUSB: boolean;

  @Column({ nullable: true })
  dataWebNFC: boolean;

  @Column({ nullable: true })
  dataWebHID: boolean;

  @Column({ nullable: true })
  dataWebSerial: boolean;

  @Column({ nullable: true })
  dataWebMIDI: boolean;

  @Column({ nullable: true })
  dataWebGamepad: boolean;

  @Column({ nullable: true })
  dataWebVRDisplay: boolean;

  @Column({ nullable: true })
  dataWebXRDisplay: boolean;

  @Column({ nullable: true })
  dataWebXRSession: boolean;

  @Column({ nullable: true })
  dataWebXRRuntime: boolean;

  @Column({ nullable: true })
  dataWebXRFrame: boolean;

  @Column({ nullable: true })
  dataWebXRLayer: boolean;

  @Column({ nullable: true })
  dataWebXRView: boolean;

  @Column({ nullable: true })
  dataWebXRInput: boolean;

  @Column({ nullable: true })
  dataWebXRSpace: boolean;

  @Column({ nullable: true })
  dataWebXRAnchor: boolean;

  @Column({ nullable: true })
  dataWebXRHitTest: boolean;

  @Column({ nullable: true })
  dataWebXRPlane: boolean;

  @Column({ nullable: true })
  dataWebXRMesh: boolean;

  @Column({ nullable: true })
  dataWebXRLight: boolean;

  @Column({ nullable: true })
  dataWebXRCamera: boolean;

  @Column({ nullable: true })
  dataWebXRRenderer: boolean;

  @Column({ nullable: true })
  dataWebXRShader: boolean;

  @Column({ nullable: true })
  dataWebXRTexture: boolean;

  @Column({ nullable: true })
  dataWebXRBuffer: boolean;

  @Column({ nullable: true })
  dataWebXRGeometry: boolean;

  @Column({ nullable: true })
  dataWebXRMaterial: boolean;

  @Column({ nullable: true })
  dataWebXRMesh: boolean;

  @Column({ nullable: true })
  dataWebXRScene: boolean;

  @Column({ nullable: true })
  dataWebXRNode: boolean;

  @Column({ nullable: true })
  dataWebXRGroup: boolean;

  @Column({ nullable: true })
  dataWebXRTransform: boolean;

  @Column({ nullable: true })
  dataWebXRAnimation: boolean;

  @Column({ nullable: true })
  dataWebXRSkeleton: boolean;

  @Column({ nullable: true })
  dataWebXRSkin: boolean;

  @Column({ nullable: true })
  dataWebXRMorph: boolean;

  @Column({ nullable: true })
  dataWebXRBlendShape: boolean;

  @Column({ nullable: true })
  dataWebXRPose: boolean;

  @Column({ nullable: true })
  dataWebXRJoint: boolean;

  @Column({ nullable: true })
  dataWebXRConstraint: boolean;

  @Column({ nullable: true })
  dataWebXRPhysics: boolean;

  @Column({ nullable: true })
  dataWebXRCollision: boolean;

  @Column({ nullable: true })
  dataWebXRGravity: boolean;

  @Column({ nullable: true })
  dataWebXRForce: boolean;

  @Column({ nullable: true })
  dataWebXRTorque: boolean;

  @Column({ nullable: true })
  dataWebXRVelocity: boolean;

  @Column({ nullable: true })
  dataWebXRAcceleration: boolean;

  @Column({ nullable: true })
  dataWebXRAngularVelocity: boolean;

  @Column({ nullable: true })
  dataWebXRAngularAcceleration: boolean;

  @Column({ nullable: true })
  dataWebXRLinearVelocity: boolean;

  @Column({ nullable: true })
  dataWebXRLinearAcceleration: boolean;

  @Column({ nullable: true })
  dataWebXRAngularMomentum: boolean;

  @Column({ nullable: true })
  dataWebXRLinearMomentum: boolean;

  @Column({ nullable: true })
  dataWebXRFriction: boolean;

  @Column({ nullable: true })
  dataWebXRRestitution: boolean;

  @Column({ nullable: true })
  dataWebXRDamping: boolean;

  @Column({ nullable: true })
  dataWebXRStiffness: boolean;

  @Column({ nullable: true })
  dataWebXRMass: boolean;

  @Column({ nullable: true })
  dataWebXRInertia: boolean;

  @Column({ nullable: true })
  dataWebXRCenterOfMass: boolean;

  @Column({ nullable: true })
  dataWebXRBoundingBox: boolean;

  @Column({ nullable: true })
  dataWebXRBoundingSphere: boolean;

  @Column({ nullable: true })
  dataWebXROrientedBoundingBox: boolean;

  @Column({ nullable: true })
  dataWebXRCapsule: boolean;

  @Column({ nullable: true })
  dataWebXRCylinder: boolean;

  @Column({ nullable: true })
  dataWebXRPlane: boolean;

  @Column({ nullable: true })
  dataWebXRTriangle: boolean;

  @Column({ nullable: true })
  dataWebXRQuad: boolean;

  @Column({ nullable: true })
  dataWebXRPolygon: boolean;

  @Column({ nullable: true })
  dataWebXRCircle: boolean;

  @Column({ nullable: true })
  dataWebXREllipse: boolean;

  @Column({ nullable: true })
  dataWebXRBezier: boolean;

  @Column({ nullable: true })
  dataWebXRSpline: boolean;

  @Column({ nullable: true })
  dataWebXRNURBS: boolean;

  @Column({ nullable: true })
  dataWebXRSubdivision: boolean;

  @Column({ nullable: true })
  dataWebXRTessellation: boolean;

  @Column({ nullable: true })
  dataWebXRLOD: boolean;

  @Column({ nullable: true })
  dataWebXROcclusion: boolean;

  @Column({ nullable: true })
  dataWebXRShadow: boolean;

  @Column({ nullable: true })
  dataWebXRReflection: boolean;

  @Column({ nullable: true })
  dataWebXRRefraction: boolean;

  @Column({ nullable: true })
  dataWebXRDiffraction: boolean;

  @Column({ nullable: true })
  dataWebXRInterference: boolean;

  @Column({ nullable: true })
  dataWebXRDispersion: boolean;

  @Column({ nullable: true })
  dataWebXRAbsorption: boolean;

  @Column({ nullable: true })
  dataWebXREmission: boolean;

  @Column({ nullable: true })
  dataWebXRScattering: boolean;

  @Column({ nullable: true })
  dataWebXRTransmission: boolean;

  @Column({ nullable: true })
  dataWebXRReflection: boolean;

  @Column({ nullable: true })
  dataWebXRRefraction: boolean;

  @Column({ nullable: true })
  dataWebXRDissipation: boolean;

  @Column({ nullable: true })
  dataWebXRAttenuation: boolean;

  @Column({ nullable: true })
  dataWebXRAbsorption: boolean;

  @Column({ nullable: true })
  dataWebXREmission: boolean;

  @Column({ nullable: true })
  dataWebXRScattering: boolean;

  @Column({ nullable: true })
  dataWebXRTransmission: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
