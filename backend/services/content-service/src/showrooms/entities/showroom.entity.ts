import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ShowroomStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum ShowroomType {
  MAIN_SHOWROOM = 'MAIN_SHOWROOM',
  SATELLITE_SHOWROOM = 'SATELLITE_SHOWROOM',
  POP_UP_SHOWROOM = 'POP_UP_SHOWROOM',
  DESIGN_STUDIO = 'DESIGN_STUDIO',
  WAREHOUSE = 'WAREHOUSE',
  DISTRIBUTION_CENTER = 'DISTRIBUTION_CENTER',
  SERVICE_CENTER = 'SERVICE_CENTER',
  EXPERIENCE_CENTER = 'EXPERIENCE_CENTER',
  MOBILE_SHOWROOM = 'MOBILE_SHOWROOM',
  VIRTUAL_SHOWROOM = 'VIRTUAL_SHOWROOM',
}

@Entity('showrooms')
export class Showroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ShowroomStatus,
    default: ShowroomStatus.DRAFT,
  })
  status: ShowroomStatus;

  @Column({
    type: 'enum',
    enum: ShowroomType,
    default: ShowroomType.MAIN_SHOWROOM,
  })
  type: ShowroomType;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zip: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  latitude: number;

  @Column({ nullable: true })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  businessHours: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  holidays: string;

  @Column({ nullable: true })
  manager: string;

  @Column({ nullable: true })
  managerEmail: string;

  @Column({ nullable: true })
  managerPhone: string;

  @Column({ nullable: true })
  capacity: number;

  @Column({ nullable: true })
  area: number;

  @Column({ nullable: true })
  parking: boolean;

  @Column({ nullable: true })
  parkingSpaces: number;

  @Column({ nullable: true })
  wheelchairAccessible: boolean;

  @Column({ nullable: true })
  wifiAvailable: boolean;

  @Column({ nullable: true })
  restrooms: boolean;

  @Column({ nullable: true })
  coffee: boolean;

  @Column({ nullable: true })
  refreshments: boolean;

  @Column({ nullable: true })
  meetingRooms: boolean;

  @Column({ nullable: true })
  designStudio: boolean;

  @Column({ nullable: true })
  workshop: boolean;

  @Column({ nullable: true })
  deliveryService: boolean;

  @Column({ nullable: true })
  installationService: boolean;

  @Column({ nullable: true })
  consultationService: boolean;

  @Column({ nullable: true })
  warrantyService: boolean;

  @Column({ nullable: true })
  repairService: boolean;

  @Column({ nullable: true })
  maintenanceService: boolean;

  @Column({ nullable: true })
  customDesignService: boolean;

  @Column({ nullable: true })
  spacePlanningService: boolean;

  @Column({ nullable: true })
  colorConsultationService: boolean;

  @Column({ nullable: true })
  materialSelectionService: boolean;

  @Column({ nullable: true })
  lightingDesignService: boolean;

  @Column({ nullable: true })
  furnitureArrangementService: boolean;

  @Column({ nullable: true })
  homeStagingService: boolean;

  @Column({ nullable: true })
  officeDesignService: boolean;

  @Column({ nullable: true })
  commercialDesignService: boolean;

  @Column({ nullable: true })
  residentialDesignService: boolean;

  @Column({ nullable: true })
  hospitalityDesignService: boolean;

  @Column({ nullable: true })
  healthcareDesignService: boolean;

  @Column({ nullable: true })
  educationDesignService: boolean;

  @Column({ nullable: true })
  retailDesignService: boolean;

  @Column({ nullable: true })
  restaurantDesignService: boolean;

  @Column({ nullable: true })
  hotelDesignService: boolean;

  @Column({ nullable: true })
  spaDesignService: boolean;

  @Column({ nullable: true })
  gymDesignService: boolean;

  @Column({ nullable: true })
  libraryDesignService: boolean;

  @Column({ nullable: true })
  museumDesignService: boolean;

  @Column({ nullable: true })
  theaterDesignService: boolean;

  @Column({ nullable: true })
  concertHallDesignService: boolean;

  @Column({ nullable: true })
  conferenceCenterDesignService: boolean;

  @Column({ nullable: true })
  exhibitionHallDesignService: boolean;

  @Column({ nullable: true })
  tradeShowDesignService: boolean;

  @Column({ nullable: true })
  eventSpaceDesignService: boolean;

  @Column({ nullable: true })
  weddingVenueDesignService: boolean;

  @Column({ nullable: true })
  partyVenueDesignService: boolean;

  @Column({ nullable: true })
  corporateOfficeDesignService: boolean;

  @Column({ nullable: true })
  coworkingSpaceDesignService: boolean;

  @Column({ nullable: true })
  startupOfficeDesignService: boolean;

  @Column({ nullable: true })
  lawOfficeDesignService: boolean;

  @Column({ nullable: true })
  medicalOfficeDesignService: boolean;

  @Column({ nullable: true })
  dentalOfficeDesignService: boolean;

  @Column({ nullable: true })
  veterinaryOfficeDesignService: boolean;

  @Column({ nullable: true })
  salonDesignService: boolean;

  @Column({ nullable: true })
  spaSalonDesignService: boolean;

  @Column({ nullable: true })
  fitnessCenterDesignService: boolean;

  @Column({ nullable: true })
  yogaStudioDesignService: boolean;

  @Column({ nullable: true })
  pilatesStudioDesignService: boolean;

  @Column({ nullable: true })
  danceStudioDesignService: boolean;

  @Column({ nullable: true })
  musicStudioDesignService: boolean;

  @Column({ nullable: true })
  artStudioDesignService: boolean;

  @Column({ nullable: true })
  photographyStudioDesignService: boolean;

  @Column({ nullable: true })
  videoStudioDesignService: boolean;

  @Column({ nullable: true })
  podcastStudioDesignService: boolean;

  @Column({ nullable: true })
  recordingStudioDesignService: boolean;

  @Column({ nullable: true })
  broadcastStudioDesignService: boolean;

  @Column({ nullable: true })
  liveStreamStudioDesignService: boolean;

  @Column({ nullable: true })
  virtualRealityStudioDesignService: boolean;

  @Column({ nullable: true })
  augmentedRealityStudioDesignService: boolean;

  @Column({ nullable: true })
  mixedRealityStudioDesignService: boolean;

  @Column({ nullable: true })
  gamingStudioDesignService: boolean;

  @Column({ nullable: true })
  esportsStudioDesignService: boolean;

  @Column({ nullable: true })
  simulationStudioDesignService: boolean;

  @Column({ nullable: true })
  trainingStudioDesignService: boolean;

  @Column({ nullable: true })
  educationStudioDesignService: boolean;

  @Column({ nullable: true })
  researchStudioDesignService: boolean;

  @Column({ nullable: true })
  developmentStudioDesignService: boolean;

  @Column({ nullable: true })
  testingStudioDesignService: boolean;

  @Column({ nullable: true })
  qualityAssuranceStudioDesignService: boolean;

  @Column({ nullable: true })
  userExperienceStudioDesignService: boolean;

  @Column({ nullable: true })
  userInterfaceStudioDesignService: boolean;

  @Column({ nullable: true })
  productDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  industrialDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  graphicDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  webDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  mobileDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  appDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  softwareDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  hardwareDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  mechanicalDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  electricalDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  civilDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  structuralDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  architecturalDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  interiorDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  landscapeDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  urbanDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  environmentalDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  sustainableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  greenDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  ecoDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  organicDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  naturalDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  biophilicDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  wellnessDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  healthDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  safetyDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  securityDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  privacyDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  accessibilityDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  inclusiveDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  universalDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  adaptiveDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  responsiveDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  flexibleDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  modularDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  scalableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  expandableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  portableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  mobileDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  temporaryDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  permanentDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  fixedDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  movableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  relocatableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  transportableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  deployableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  collapsibleDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  foldableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  stackableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  nestableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  interlockingDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  connectableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  detachableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  attachableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  mountableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  hangableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  standableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  sitableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  lieableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  climbableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  walkableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  runnableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  cyclableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  drivableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  flyableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  swimmableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  divableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  sailableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rowableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  paddleableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  skiiableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  snowboardableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  surfableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  skateboardableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rollerbladeableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  iceSkateableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  hockeyableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  basketballableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  tennisableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  soccerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  footballableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  baseballableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  golfableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  bowlingableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  poolableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  billiardableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  pingPongableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  badmintonableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  volleyballableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  handballableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  racquetballableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  squashableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  croquetableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  horseshoeableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  cornholeableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  frisbeeableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  discGolfableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  kiteableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  droneableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcCarableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPlaneableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcBoatableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcHelicopterableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcDroneableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSubmarineableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcTankableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcRobotableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcTrainableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcTruckableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcBikeableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcMotorcycleableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcAtvableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcUtvableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcGolfCartableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcLawnMowerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSnowBlowerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcLeafBlowerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPressureWasherableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPowerWasherableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcVacuumableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSteamCleanerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcAirPurifierableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcHumidifierableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcDehumidifierableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFanableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcHeaterableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcAirConditionerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcRefrigeratorableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFreezerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOvenableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcStoveableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcMicrowaveableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcDishwasherableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcWasherableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcDryerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcCoffeeMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcBlenderableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcMixerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFoodProcessorableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcToasterableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcToasterOvenableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcAirFryerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcDeepFryerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPressureCookerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSlowCookerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcRiceCookerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSousVidableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcGrillableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSmokerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcRotisserieableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPizzaOvenableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcWaffleMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPancakeMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcDonutMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcIceCreamMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcYogurtMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPopcornMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcCottonCandyMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSnowConeMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSlushieMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcJuicerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcCitrusJuicerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcWheatgrassJuicerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSmoothieBlenderableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcNutMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSoyMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcAlmondMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcCoconutMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcRiceMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcHempMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFlaxMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcQuinoaMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPeaMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcCashewMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcMacadamiaMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPistachioMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcWalnutMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPecanMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcHazelnutMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcBrazilNutMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPineNutMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSunflowerSeedMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcPumpkinSeedMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSesameSeedMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFlaxseedMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcChiaSeedMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcHempSeedMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcQuinoaSeedMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcBuckwheatMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcMilletMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcAmaranthMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSpeltMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcKamutMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcEinkornMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcEmmerMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFarroMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFreekehMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcTeffMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSorghumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcMiloMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcFonioMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcJobTearMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcKaniwaMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcKaoniwaMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatGroatsMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcSteelCutOatsMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcRolledOatsMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcInstantOatsMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcScottishOatsMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcIrishOatsMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatBranMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatFlourMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkPowderMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkConcentrateMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkSyrupMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkHoneyMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkMapleMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAgaveMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkSteviaMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkMonkFruitMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkErythritolMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkXylitolMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAlluloseMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkTagatoseMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkIsomaltMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkMaltitolMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkSorbitolMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkMannitolMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkLactitolMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkXanthanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGuarGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkLocustBeanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkCarrageenanMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkPectinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGelatinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAgarAgarMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkCarrageenanMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkXanthanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGuarGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkLocustBeanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkPectinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGelatinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAgarAgarMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkCarrageenanMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkXanthanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGuarGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkLocustBeanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkPectinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGelatinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAgarAgarMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkCarrageenanMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkXanthanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGuarGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkLocustBeanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkPectinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGelatinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAgarAgarMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkCarrageenanMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkXanthanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGuarGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkLocustBeanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkPectinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGelatinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAgarAgarMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkCarrageenanMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkXanthanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGuarGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkLocustBeanGumMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkPectinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkGelatinMilkMakerableDesignStudioDesignService: boolean;

  @Column({ nullable: true })
  rcOatMilkAgarAgarMilkMakerableDesignStudioDesignService: boolean;

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
  appointmentCount: number;

  @Column({ nullable: true })
  reviewCount: number;

  @Column({ nullable: true })
  averageRating: number;

  @Column({ nullable: true })
  conversionRate: number;

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
