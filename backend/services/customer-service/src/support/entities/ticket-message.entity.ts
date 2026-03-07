import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

export enum MessageType {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  SYSTEM = 'SYSTEM',
}

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => 'SupportTicket', ticket => ticket.messages)
  ticket: any;

  @Column()
  ticketId: string;

  @ManyToOne(() => 'User')
  author: any;

  @Column({ nullable: true })
  authorId: string;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  authorType: MessageType;

  @Column()
  content: string;

  @Column({ nullable: true })
  attachments: string[]; // Array of file URLs

  @Column({ default: false })
  isInternal: boolean;

  @Column({ nullable: true })
  isEdited: boolean;

  @Column({ nullable: true })
  editedAt: Date;

  @Column({ nullable: true })
  editedBy: string;

  @Column({ nullable: true })
  replyTo: string; // ID of message being replied to

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  readBy: string; // Array of user IDs who read this message

  @Column({ nullable: true })
  reaction: string; // Emoji or reaction

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  tags: string[];

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  translation: string; // Translated content if needed

  @Column({ nullable: true })
  originalLanguage: string;

  @Column({ nullable: true })
  sentiment: string; // Sentiment analysis result

  @Column({ nullable: true })
  sentimentScore: number; // Sentiment score

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
