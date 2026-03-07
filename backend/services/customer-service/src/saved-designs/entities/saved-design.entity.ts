import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

export enum DesignStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum DesignComplexity {
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX',
  EXPERT = 'EXPERT',
}

@Entity('saved_designs')
export class SavedDesign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => 'Customer')
  customer: any;

  @Column()
  customerId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  style: string;

  @Column({ nullable: true })
  room: string;

  @Column({
    type: 'enum',
    enum: DesignStatus,
    default: DesignStatus.DRAFT,
  })
  status: DesignStatus;

  @Column({
    type: 'enum',
    enum: DesignComplexity,
    nullable: true,
  })
  complexity: DesignComplexity;

  @Column({ nullable: true })
  tags: string[]; // Array of tags for categorization

  @Column({ nullable: true })
  colors: string[]; // Array of color codes used

  @Column({ nullable: true })
  materials: string[]; // Array of materials used

  @Column({ nullable: true })
  dimensions: string; // JSON string with room dimensions

  @Column({ nullable: true })
  budget: string; // JSON string with budget information

  @Column({ nullable: true })
  timeline: string; // JSON string with project timeline

  @Column({ nullable: true })
  designData: string; // JSON string with full design data

  @Column({ nullable: true })
  thumbnail: string; // URL to thumbnail image

  @Column({ nullable: true })
  images: string[]; // Array of image URLs

  @Column({ nullable: true })
  videos: string[]; // Array of video URLs

  @Column({ nullable: true })
  files: string[]; // Array of file URLs (CAD files, etc.)

  @Column({ nullable: true })
  version: number;

  @Column({ nullable: true })
  isPublic: boolean;

  @Column({ nullable: true })
  shareToken: string;

  @Column({ nullable: true })
  shareExpiresAt: Date;

  @Column({ nullable: true })
  sharedAt: Date;

  @Column({ nullable: true })
  sharedBy: string;

  @Column({ nullable: true })
  viewCount: number;

  @Column({ nullable: true })
  likeCount: number;

  @Column({ nullable: true })
  downloadCount: number;

  @Column({ nullable: true })
  commentCount: number;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  ratingCount: number;

  @Column({ nullable: true })
  featured: boolean;

  @Column({ nullable: true })
  featuredAt: Date;

  @Column({ nullable: true })
  featuredBy: string;

  @Column({ nullable: true })
  duplicatedFrom: string;

  @Column({ nullable: true })
  duplicatedBy: string;

  @Column({ nullable: true })
  duplicatedAt: Date;

  @Column({ nullable: true })
  lastModifiedAt: Date;

  @Column({ nullable: true })
  modifiedBy: string;

  @Column({ nullable: true })
  collaborators: string[]; // Array of customer IDs who can collaborate

  @Column({ nullable: true })
  permissions: string; // JSON string with permission settings

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ nullable: true })
  settings: string; // JSON string with design settings

  @Column({ nullable: true })
  template: boolean; // Whether this design is a template

  @Column({ nullable: true })
  templateCategory: string;

  @Column({ nullable: true })
  templatePrice: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  estimatedCost: number;

  @Column({ nullable: true })
  estimatedTime: number; // in hours

  @Column({ nullable: true })
  difficulty: number; // 1-10 scale

  @Column({ nullable: true })
  skillLevel: string; // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

  @Column({ nullable: true })
  tools: string[]; // Array of tools required

  @Column({ nullable: true })
  instructions: string; // JSON string with step-by-step instructions

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string; // For staff use

  @Column({ nullable: true })
  designTags: string[]; // SEO and categorization tags

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column({ nullable: true })
  seoKeywords: string[];

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  archivedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ nullable: true })
  deletionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
