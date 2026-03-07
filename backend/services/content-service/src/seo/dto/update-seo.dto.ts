import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { SeoStatus, ChangeFrequency } from '../entities/seo-meta.entity';

export class UpdateSeoDto {
  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsEnum(SeoStatus)
  status?: SeoStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  priority?: number;

  @IsOptional()
  @IsEnum(ChangeFrequency)
  changeFrequency?: ChangeFrequency;

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
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audio?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternateUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hreflang?: string[];

  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @IsOptional()
  @IsBoolean()
  noFollow?: boolean;

  @IsOptional()
  @IsBoolean()
  noArchive?: boolean;

  @IsOptional()
  @IsBoolean()
  noSnippet?: boolean;

  @IsOptional()
  @IsBoolean()
  noImageIndex?: boolean;

  @IsOptional()
  @IsBoolean()
  noTranslate?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSnippet?: number;

  @IsOptional()
  @IsString()
  maxImagePreview?: string;

  @IsOptional()
  @IsString()
  maxVideoPreview?: string;

  @IsOptional()
  @IsBoolean()
  pageMap?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  newsKeywords?: string[];

  @IsOptional()
  @IsBoolean()
  newsStandout?: boolean;

  @IsOptional()
  @IsString()
  newsPublication?: string;

  @IsOptional()
  @IsString()
  newsPublicationDate?: string;

  @IsOptional()
  @IsString()
  newsTitle?: string;

  @IsOptional()
  @IsString()
  newsAuthor?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  newsGenre?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  newsStockTickers?: string[];

  @IsOptional()
  @IsString()
  recipeName?: string;

  @IsOptional()
  @IsString()
  recipeDescription?: string;

  @IsOptional()
  @IsString()
  recipeImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipeIngredients?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipeInstructions?: string[];

  @IsOptional()
  @IsString()
  recipePrepTime?: string;

  @IsOptional()
  @IsString()
  recipeCookTime?: string;

  @IsOptional()
  @IsString()
  recipeTotalTime?: string;

  @IsOptional()
  @IsString()
  recipeYield?: string;

  @IsOptional()
  @IsString()
  recipeCategory?: string;

  @IsOptional()
  @IsString()
  recipeCuisine?: string;

  @IsOptional()
  @IsString()
  recipeNutrition?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  recipeRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recipeReviewCount?: number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsString()
  productImage?: string;

  @IsOptional()
  @IsString()
  productBrand?: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsOptional()
  @IsString()
  productGtin?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  productPrice?: number;

  @IsOptional()
  @IsString()
  productCurrency?: string;

  @IsOptional()
  @IsString()
  productAvailability?: string;

  @IsOptional()
  @IsString()
  productCondition?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  productRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  productReviewCount?: number;

  @IsOptional()
  @IsString()
  productSeller?: string;

  @IsOptional()
  @IsString()
  productShipping?: string;

  @IsOptional()
  @IsString()
  productReturnPolicy?: string;

  @IsOptional()
  @IsString()
  productWarranty?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productMaterial?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productColor?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productSize?: string[];

  @IsOptional()
  @IsString()
  productWeight?: string;

  @IsOptional()
  @IsString()
  productDimensions?: string;

  @IsOptional()
  @IsString()
  productOrigin?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCertifications?: string[];

  @IsOptional()
  @IsBoolean()
  productEcoFriendly?: boolean;

  @IsOptional()
  @IsBoolean()
  productOrganic?: boolean;

  @IsOptional()
  @IsBoolean()
  productFairTrade?: boolean;

  @IsOptional()
  @IsBoolean()
  productHandmade?: boolean;

  @IsOptional()
  @IsBoolean()
  productCustomizable?: boolean;

  @IsOptional()
  @IsBoolean()
  productLimitedEdition?: boolean;

  @IsOptional()
  @IsBoolean()
  productExclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  productNewArrival?: boolean;

  @IsOptional()
  @IsBoolean()
  productBestSeller?: boolean;

  @IsOptional()
  @IsBoolean()
  productSale?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  productDiscount?: number;

  @IsOptional()
  @IsString()
  productDiscountType?: string;

  @IsOptional()
  @IsString()
  productDiscountValidUntil?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productRelatedItems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productAccessories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productVariants?: string[];

  @IsOptional()
  @IsString()
  productCustomFields?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  productSeoScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productSeoRecommendations?: string[];

  @IsOptional()
  @IsString()
  articleTitle?: string;

  @IsOptional()
  @IsString()
  articleDescription?: string;

  @IsOptional()
  @IsString()
  articleImage?: string;

  @IsOptional()
  @IsString()
  articleAuthor?: string;

  @IsOptional()
  @IsString()
  articleAuthorUrl?: string;

  @IsOptional()
  @IsString()
  articlePublisher?: string;

  @IsOptional()
  @IsString()
  articlePublisherUrl?: string;

  @IsOptional()
  @IsString()
  articlePublishedAt?: string;

  @IsOptional()
  @IsString()
  articleModifiedAt?: string;

  @IsOptional()
  @IsString()
  articleCategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleTags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  articleWordCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  articleReadingTime?: number;

  @IsOptional()
  @IsString()
  articleDifficulty?: string;

  @IsOptional()
  @IsString()
  articleLanguage?: string;

  @IsOptional()
  @IsString()
  articleRegion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleAudience?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleTopics?: string[];

  @IsOptional()
  @IsString()
  articleExpertiseLevel?: string;

  @IsOptional()
  @IsBoolean()
  articleFactChecked?: boolean;

  @IsOptional()
  @IsString()
  articleFactChecker?: string;

  @IsOptional()
  @IsString()
  articleFactCheckDate?: string;

  @IsOptional()
  @IsString()
  articleFactCheckRating?: string;

  @IsOptional()
  @IsString()
  articleFactCheckNotes?: string;

  @IsOptional()
  @IsBoolean()
  articleSponsored?: boolean;

  @IsOptional()
  @IsString()
  articleSponsor?: string;

  @IsOptional()
  @IsString()
  articleSponsorUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleAffiliateLinks?: string[];

  @IsOptional()
  @IsBoolean()
  articleMonetized?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleAdNetworks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleAdPlacement?: string[];

  @IsOptional()
  @IsString()
  articleAdFrequency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  articleAdDensity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  articleAdRevenue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  articleSeoScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articleSeoRecommendations?: string[];

  @IsOptional()
  @IsString()
  localBusinessName?: string;

  @IsOptional()
  @IsString()
  localBusinessDescription?: string;

  @IsOptional()
  @IsString()
  localBusinessImage?: string;

  @IsOptional()
  @IsString()
  localBusinessAddress?: string;

  @IsOptional()
  @IsString()
  localBusinessCity?: string;

  @IsOptional()
  @IsString()
  localBusinessState?: string;

  @IsOptional()
  @IsString()
  localBusinessZip?: string;

  @IsOptional()
  @IsString()
  localBusinessCountry?: string;

  @IsOptional()
  @IsString()
  localBusinessPhone?: string;

  @IsOptional()
  @IsString()
  localBusinessEmail?: string;

  @IsOptional()
  @IsString()
  localBusinessWebsite?: string;

  @IsOptional()
  @IsString()
  localBusinessHours?: string;

  @IsOptional()
  @IsString()
  localBusinessPriceRange?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessPaymentMethods?: string[];

  @IsOptional()
  @IsBoolean()
  localBusinessDelivery?: boolean;

  @IsOptional()
  @IsBoolean()
  localBusinessPickup?: boolean;

  @IsOptional()
  @IsBoolean()
  localBusinessShipping?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessServiceArea?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessLanguages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessAccessibility?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessParking?: string[];

  @IsOptional()
  @IsBoolean()
  localBusinessWifi?: boolean;

  @IsOptional()
  @IsBoolean()
  localBusinessOutdoorSeating?: boolean;

  @IsOptional()
  @IsBoolean()
  localBusinessReservations?: boolean;

  @IsOptional()
  @IsBoolean()
  localBusinessTakeout?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  localBusinessDeliveryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  localBusinessMinimumOrder?: number;

  @IsOptional()
  @IsString()
  localBusinessDeliveryTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  localBusinessRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  localBusinessReviewCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessReviews?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessAwards?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessCertifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessMemberships?: string[];

  @IsOptional()
  @IsString()
  localBusinessFounded?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  localBusinessEmployees?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  localBusinessRevenue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  localBusinessSeoScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  localBusinessSeoRecommendations?: string[];

  @IsOptional()
  @IsString()
  customMeta?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trackingPixels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  analyticsScripts?: string[];

  @IsOptional()
  @IsString()
  conversionTracking?: string;

  @IsOptional()
  @IsBoolean()
  heatmaps?: boolean;

  @IsOptional()
  @IsBoolean()
  sessionRecording?: boolean;

  @IsOptional()
  @IsBoolean()
  aBTesting?: boolean;

  @IsOptional()
  @IsBoolean()
  personalization?: boolean;

  @IsOptional()
  @IsBoolean()
  localization?: boolean;

  @IsOptional()
  @IsBoolean()
  internationalization?: boolean;

  @IsOptional()
  @IsBoolean()
  accessibility?: boolean;

  @IsOptional()
  @IsBoolean()
  performance?: boolean;

  @IsOptional()
  @IsBoolean()
  security?: boolean;

  @IsOptional()
  @IsBoolean()
  privacy?: boolean;

  @IsOptional()
  @IsBoolean()
  gdpr?: boolean;

  @IsOptional()
  @IsBoolean()
  ccpa?: boolean;

  @IsOptional()
  @IsBoolean()
  cookieConsent?: boolean;

  @IsOptional()
  @IsString()
  dataProcessing?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dataRetention?: number;

  @IsOptional()
  @IsBoolean()
  dataDeletion?: boolean;

  @IsOptional()
  @IsBoolean()
  dataPortability?: boolean;

  @IsOptional()
  @IsBoolean()
  dataCorrection?: boolean;

  @IsOptional()
  @IsBoolean()
  dataAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  dataOptOut?: boolean;

  @IsOptional()
  @IsBoolean()
  dataMarketing?: boolean;

  @IsOptional()
  @IsBoolean()
  dataAnalytics?: boolean;

  @IsOptional()
  @IsBoolean()
  dataAdvertising?: boolean;

  @IsOptional()
  @IsBoolean()
  dataThirdParty?: boolean;

  @IsOptional()
  @IsBoolean()
  dataFirstParty?: boolean;

  @IsOptional()
  @IsBoolean()
  dataCookies?: boolean;

  @IsOptional()
  @IsBoolean()
  dataLocalStorage?: boolean;

  @IsOptional()
  @IsBoolean()
  dataSessionStorage?: boolean;

  @IsOptional()
  @IsBoolean()
  dataIndexedDB?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebSQL?: boolean;

  @IsOptional()
  @IsBoolean()
  dataFileSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  dataCache?: boolean;

  @IsOptional()
  @IsBoolean()
  dataServiceWorker?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebAssembly?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebGL?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebRTC?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebSocket?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebAudio?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebVR?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebAR?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXR?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebBluetooth?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebUSB?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebNFC?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebHID?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebSerial?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebMIDI?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebGamepad?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebVRDisplay?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRDisplay?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRSession?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRRuntime?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRFrame?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRLayer?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRView?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRInput?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRSpace?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAnchor?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRHitTest?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRPlane?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRMesh?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRLight?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRCamera?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRRenderer?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRShader?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRTexture?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRBuffer?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRGeometry?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRMaterial?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRMesh?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRScene?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRNode?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRTransform?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAnimation?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRSkeleton?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRSkin?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRMorph?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRPose?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRJoint?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRConstraint?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRPhysics?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRCollision?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRGravity?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRForce?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRTorque?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRVelocity?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAcceleration?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAngularVelocity?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAngularAcceleration?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRLinearVelocity?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRLinearAcceleration?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAngularMomentum?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRLinearMomentum?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRFriction?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRRestitution?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRDamping?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRStiffness?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRMass?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRInertia?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRCenterOfMass?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRBoundingBox?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRBoundingSphere?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXROrientedBoundingBox?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRCapsule?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRCylinder?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRPlane?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRTriangle?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRQuad?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRPolygon?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRCircle?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXREllipse?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRBezier?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRSpline?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRNURBS?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRSubdivision?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRTessellation?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXROcclusion?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRShadow?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRReflection?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRRefraction?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRDiffraction?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRInterference?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRDispersion?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAbsorption?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXREmission?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRScattering?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRTransmission?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRReflection?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRRefraction?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRDissipation?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAttenuation?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRAbsorption?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXREmission?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRScattering?: boolean;

  @IsOptional()
  @IsBoolean()
  dataWebXRTransmission?: boolean;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
