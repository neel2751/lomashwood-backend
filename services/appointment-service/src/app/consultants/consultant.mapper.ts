import { ConsultantResponse, ShowroomSummary } from './consultant.types';


interface Consultant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  specializations: unknown;
  showroomId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ConsultantWithRelations = Consultant & {
  showroom?: {
    id: string;
    name: string;
    address: string;
    phone?: string | null;
    email?: string | null;
  } | null;
};

export class ConsultantMapper {
  toResponse(consultant: ConsultantWithRelations): ConsultantResponse {
    return {
      id: consultant.id,
      name: consultant.name,
      email: consultant.email,
      phone: consultant.phone ?? undefined,
      bio: consultant.bio ?? undefined,
      avatar: consultant.avatar ?? undefined,
      specializations: consultant.specializations as string[],
      showroomId: consultant.showroomId ?? undefined,
      isActive: consultant.isActive,
      showroom: consultant.showroom
        ? this.toShowroomSummary(consultant.showroom)
        : undefined,
      createdAt: consultant.createdAt,
      updatedAt: consultant.updatedAt,
    };
  }

  toResponseList(consultants: ConsultantWithRelations[]): ConsultantResponse[] {
    return consultants.map((c) => this.toResponse(c));
  }

  private toShowroomSummary(showroom: {
    id: string;
    name: string;
    address: string;
    phone?: string | null;
    email?: string | null;
  }): ShowroomSummary {
    return {
      id: showroom.id,
      name: showroom.name,
      address: showroom.address,
      phone: showroom.phone ?? undefined,
      email: showroom.email ?? undefined,
    };
  }
}