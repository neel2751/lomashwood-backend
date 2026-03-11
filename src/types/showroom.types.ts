export type ShowroomTeamMember = {
  name: string;
  role: string;
};

export type ShowroomDisplayProduct = {
  id?: string;
  productId: string;
  isPrimary?: boolean;
  product?: {
    id: string;
    title: string;
    category: "kitchen" | "bedroom";
    style?: string | null;
    image?: string | null;
  };
};

export type ShowroomOpeningHour = {
  day: string;
  date?: string;
  hours: string;
};

export type Showroom = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  image?: string;
  imageMediaId?: string;
  imageMedia?: {
    id: string;
    url: string;
    status: string;
  };
  openToday?: string;
  facilities: string[];
  team: ShowroomTeamMember[];
  displayProducts: ShowroomDisplayProduct[];
  openingHours: ShowroomOpeningHour[];
  nearbyStores: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateShowroomPayload = {
  slug: string;
  name: string;
  city: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image?: string;
  imageMediaId?: string;
  openToday?: string;
  facilities: string[];
  team: ShowroomTeamMember[];
  displayProducts: ShowroomDisplayProduct[];
  openingHours: ShowroomOpeningHour[];
  nearbyStores: string[];
};

export type UpdateShowroomPayload = Partial<CreateShowroomPayload>;
