import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min, Max, IsEmail } from 'class-validator';
import { ShowroomStatus, ShowroomType } from '../entities/showroom.entity';

export class UpdateShowroomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ShowroomStatus)
  status?: ShowroomStatus;

  @IsOptional()
  @IsEnum(ShowroomType)
  type?: ShowroomType;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidays?: string[];

  @IsOptional()
  @IsString()
  manager?: string;

  @IsOptional()
  @IsEmail()
  managerEmail?: string;

  @IsOptional()
  @IsString()
  managerPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsBoolean()
  parking?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  parkingSpaces?: number;

  @IsOptional()
  @IsBoolean()
  wheelchairAccessible?: boolean;

  @IsOptional()
  @IsBoolean()
  wifiAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  restrooms?: boolean;

  @IsOptional()
  @IsBoolean()
  coffee?: boolean;

  @IsOptional()
  @IsBoolean()
  refreshments?: boolean;

  @IsOptional()
  @IsBoolean()
  meetingRooms?: boolean;

  @IsOptional()
  @IsBoolean()
  designStudio?: boolean;

  @IsOptional()
  @IsBoolean()
  workshop?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryService?: boolean;

  @IsOptional()
  @IsBoolean()
  installationService?: boolean;

  @IsOptional()
  @IsBoolean()
  consultationService?: boolean;

  @IsOptional()
  @IsBoolean()
  warrantyService?: boolean;

  @IsOptional()
  @IsBoolean()
  repairService?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceService?: boolean;

  @IsOptional()
  @IsBoolean()
  customDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  spacePlanningService?: boolean;

  @IsOptional()
  @IsBoolean()
  colorConsultationService?: boolean;

  @IsOptional()
  @IsBoolean()
  materialSelectionService?: boolean;

  @IsOptional()
  @IsBoolean()
  lightingDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  furnitureArrangementService?: boolean;

  @IsOptional()
  @IsBoolean()
  homeStagingService?: boolean;

  @IsOptional()
  @IsBoolean()
  officeDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  commercialDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  residentialDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  hospitalityDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  healthcareDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  educationDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  retailDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  restaurantDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  hotelDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  spaDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  gymDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  libraryDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  museumDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  theaterDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  concertHallDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  conferenceCenterDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  exhibitionHallDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  tradeShowDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  eventSpaceDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  weddingVenueDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  partyVenueDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  corporateOfficeDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  coworkingSpaceDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  startupOfficeDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  lawOfficeDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  medicalOfficeDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  dentalOfficeDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  veterinaryOfficeDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  salonDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  spaSalonDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  fitnessCenterDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  yogaStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  pilatesStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  danceStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  musicStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  artStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  photographyStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  videoStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  podcastStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  recordingStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  broadcastStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  liveStreamStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  virtualRealityStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  augmentedRealityStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  mixedRealityStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  gamingStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  esportsStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  simulationStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  trainingStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  educationStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  researchStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  developmentStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  testingStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  qualityAssuranceStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  userExperienceStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  userInterfaceStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  productDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  industrialDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  graphicDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  webDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  mobileAppDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  appDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  softwareDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  hardwareDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  mechanicalDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  electricalDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  civilDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  structuralDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  architecturalDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  interiorDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  landscapeDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  urbanDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  environmentalDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  sustainableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  greenDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  ecoDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  organicDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  naturalDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  biophilicDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  wellnessDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  healthDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  safetyDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  securityDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  privacyDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  accessibilityDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  inclusiveDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  universalDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  adaptiveDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  responsiveDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  flexibleDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  modularDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  scalableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  expandableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  portableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  mobileShowroomDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  temporaryDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  permanentDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  fixedDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  movableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  relocatableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  transportableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  deployableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  collapsibleDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  foldableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  stackableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  nestableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  interlockingDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  connectableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  detachableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  attachableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  mountableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  hangableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  standableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  sitableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  lieableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  climbableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  walkableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  runnableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  cyclableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  drivableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  flyableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  swimmableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  divableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  sailableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rowableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  paddleableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  skiiableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  snowboardableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  surfableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  skateboardableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rollerbladeableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  iceSkateableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  hockeyableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  basketballableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  tennisableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  soccerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  footballableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  baseballableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  golfableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  bowlingableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  poolableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  billiardableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  pingPongableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  badmintonableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  volleyballableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  handballableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  racquetballableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  squashableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  croquetableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  horseshoeableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  cornholeableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  frisbeeableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  discGolfableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  kiteableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  droneableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcCarableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPlaneableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcBoatableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcHelicopterableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcDroneableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSubmarineableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcTankableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcRobotableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcTrainableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcTruckableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcBikeableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcMotorcycleableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcAtvableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcUtvableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcGolfCartableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcLawnMowerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSnowBlowerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcLeafBlowerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPressureWasherableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPowerWasherableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcVacuumableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSteamCleanerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcAirPurifierableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcHumidifierableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcDehumidifierableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFanableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcHeaterableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcAirConditionerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcRefrigeratorableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFreezerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOvenableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcStoveableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcMicrowaveableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcDishwasherableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcWasherableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcDryerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcCoffeeMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcBlenderableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcMixerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFoodProcessorableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcToasterableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcToasterOvenableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcAirFryerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcDeepFryerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPressureCookerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSlowCookerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcRiceCookerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSousVidableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcGrillableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSmokerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcRotisserieableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPizzaOvenableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcWaffleMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPancakeMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcDonutMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcIceCreamMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcYogurtMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPopcornMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcCottonCandyMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSnowConeMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSlushieMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcJuicerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcCitrusJuicerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcWheatgrassJuicerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSmoothieBlenderableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcNutMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSoyMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcAlmondMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcCoconutMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcRiceMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcHempMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFlaxMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcQuinoaMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPeaMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcCashewMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcMacadamiaMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPistachioMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcWalnutMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPecanMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcHazelnutMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcBrazilNutMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPineNutMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSunflowerSeedMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcPumpkinSeedMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSesameSeedMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFlaxseedMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcChiaSeedMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcHempSeedMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcQuinoaSeedMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcBuckwheatMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcMilletMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcAmaranthMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSpeltMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcKamutMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcEinkornMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcEmmerMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFarroMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFreekehMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcTeffMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSorghumMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcMiloMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcFonioMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcJobTearMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcKaniwaMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcKaoniwaMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatGroatsMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcSteelCutOatsMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcRolledOatsMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcInstantOatsMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcScottishOatsMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcIrishOatsMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatBranMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatFlourMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkPowderMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkConcentrateMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkSyrupMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkHoneyMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkMapleMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkAgaveMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkSteviaMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkMonkFruitMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkErythritolMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkXylitolMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkAlluloseMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkTagatoseMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkIsomaltMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkMaltitolMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkSorbitolMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkMannitolMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkLactitolMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkXanthanGumMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkGuarGumMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkLocustBeanGumMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkCarrageenanMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkPectinMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkGelatinMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  rcOatMilkAgarAgarMilkMakerableDesignStudioDesignService?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  featuredAt?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  publishedBy?: string;

  @IsOptional()
  @IsString()
  archivedAt?: string;

  @IsOptional()
  @IsString()
  archivedBy?: string;

  @IsOptional()
  @IsString()
  deletedAt?: string;

  @IsOptional()
  @IsString()
  deletedBy?: string;

  @IsOptional()
  @IsString()
  deletionReason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  viewCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  appointmentCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reviewCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate?: number;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  lastModifiedAt?: string;

  @IsOptional()
  @IsString()
  lastModifiedBy?: string;

  @IsOptional()
  @IsString()
  reviewedAt?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  rejectedAt?: string;

  @IsOptional()
  @IsString()
  rejectedBy?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

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
  @IsString()
  aBTestResults?: string;

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
  @IsNumber()
  @Min(0)
  version?: number;

  @IsOptional()
  @IsString()
  changelog?: string;

  @IsOptional()
  @IsString()
  migration?: string;

  @IsOptional()
  @IsBoolean()
  rollbackEnabled?: boolean;

  @IsOptional()
  @IsString()
  rollbackPoint?: string;

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
}
