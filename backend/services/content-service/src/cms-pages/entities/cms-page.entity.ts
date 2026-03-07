import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum PageType {
  HOME = 'HOME',
  ABOUT = 'ABOUT',
  CONTACT = 'CONTACT',
  PRODUCTS = 'PRODUCTS',
  SERVICES = 'SERVICES',
  BLOG = 'BLOG',
  GALLERY = 'GALLERY',
  FAQ = 'FAQ',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
  CUSTOM = 'CUSTOM',
}

@Entity('cms_pages')
export class CmsPage {
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
    enum: PageStatus,
    default: PageStatus.DRAFT,
  })
  status: PageStatus;

  @Column({
    type: 'enum',
    enum: PageType,
    default: PageType.CUSTOM,
  })
  type: PageType;

  @Column({ nullable: true })
  template: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  sortOrder: number;

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
  duplicatedFrom: string;

  @Column({ nullable: true })
  duplicatedBy: string;

  @Column({ nullable: true })
  duplicatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
