
import { z } from "zod";
import {
  PRODUCT_CATEGORIES,
  APPOINTMENT_TYPES,
  PRODUCT_FINISH_OPTIONS,
  PRODUCT_STYLE_OPTIONS,
  NOTIFICATION_CHANNELS,
  REVIEW_STATUSES,
  SUPPORT_STATUSES,
  ORDER_STATUSES,
  LOYALTY_TIERS,
  MAX_FILE_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
  MAX_PRODUCT_IMAGES,
} from "./constants";
import { isValidHex } from "./utils";

export const zRequiredString = (label = "This field") =>
  z.string().trim().min(1, `${label} is required`);


export const zOptionalString = z.string().trim().optional().or(z.literal("")).transform(
  (v) => (v === "" ? undefined : v),
);

export const zUrl = z
  .string()
  .url("Please enter a valid URL")
  .or(z.literal(""));


export const zPhone = z
  .string()
  .regex(/^[+\d\s().-]{7,20}$/, "Please enter a valid phone number");


export const zEmail = z.string().email("Please enter a valid email address");


export const zPostcode = z
  .string()
  .regex(
    /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    "Please enter a valid UK postcode",
  );

export const zHexColour = z
  .string()
  .refine(isValidHex, { message: "Please enter a valid hex colour (e.g. #FF5733)" });


export const zPositiveInt = z.number().int().positive();


export const zNonNegativeInt = z.number().int().min(0);


export const zPrice = z.number().positive("Price must be greater than 0");


export const zIsoDate = z.string().datetime({ message: "Please enter a valid date" });


export const zDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");


export const zTimeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format");



export const zProductCategory = z.enum(PRODUCT_CATEGORIES);
export const zAppointmentType = z.enum(APPOINTMENT_TYPES);
export const zOrderStatus = z.enum(ORDER_STATUSES);
export const zReviewStatus = z.enum(REVIEW_STATUSES);
export const zSupportStatus = z.enum(SUPPORT_STATUSES);
export const zNotificationChannel = z.enum(NOTIFICATION_CHANNELS);
export const zLoyaltyTier = z.enum(LOYALTY_TIERS);
export const zFinish = z.enum(
  PRODUCT_FINISH_OPTIONS.map((o) => o.value) as [string, ...string[]],
);
export const zStyle = z.enum(
  PRODUCT_STYLE_OPTIONS.map((o) => o.value) as [string, ...string[]],
);

export const zImageFile = z
  .instanceof(File)
  .refine(
    (f) => f.size <= MAX_FILE_SIZE_BYTES,
    { message: `File must be under ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB` },
  )
  .refine(
    (f) => ACCEPTED_IMAGE_TYPES.includes(f.type),
    { message: "Only JPEG, PNG, WebP, and GIF images are accepted" },
  );

export const zImageFileList = z
  .array(zImageFile)
  .max(MAX_PRODUCT_IMAGES, `You can upload a maximum of ${MAX_PRODUCT_IMAGES} images`);


export const zColourBase = z.object({
  name: zRequiredString("Colour name").max(50),
  hexCode: zHexColour,
});

export const zSizeBase = z.object({
  title: zRequiredString("Size title").max(100),
  description: z.string().trim().max(500).optional(),
  image: zUrl.optional(),
});

export const zPricingBase = z.object({
  label: zRequiredString("Pricing label").max(100),
  price: zPrice,
  productId: z.string().uuid("Invalid product ID"),
});

export const zProductBase = z.object({
  title: zRequiredString("Product title").max(150),
  description: zRequiredString("Description").max(2000),
  category: zProductCategory,
  rangeName: zRequiredString("Range name").max(100),
  price: zPrice.optional(),
  colourIds: z.array(z.string().uuid()).min(1, "Select at least one colour"),
  sizeIds: z.array(z.string().uuid()).optional(),
});

export const zCategoryBase = z.object({
  name: zRequiredString("Category name").max(100),
  type: zProductCategory,
});

export const zSaleBase = z.object({
  title: zRequiredString("Sale title").max(150),
  description: z.string().trim().max(1000).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  categories: z.array(zProductCategory).optional(),
});

export const zPackageBase = z.object({
  title: zRequiredString("Package title").max(150),
  description: z.string().trim().max(1000).optional(),
});

export const zShowroomBase = z.object({
  name: zRequiredString("Showroom name").max(150),
  address: zRequiredString("Address").max(300),
  email: zEmail,
  phone: zPhone,
  openingHours: zRequiredString("Opening hours").max(500),
  mapLink: zUrl,
});

export const zAppointmentBase = z.object({
  type: zAppointmentType,
  forKitchen: z.boolean(),
  forBedroom: z.boolean(),
  customerName: zRequiredString("Name").max(150),
  customerEmail: zEmail,
  customerPhone: zPhone,
  postcode: zPostcode,
  address: zRequiredString("Address").max(300),
  slot: zIsoDate,
}).refine(
  (data) => data.forKitchen || data.forBedroom,
  {
    message: "Please select at least one of Kitchen or Bedroom",
    path: ["forKitchen"],
  },
);

export const zBrochureRequestBase = z.object({
  name: zRequiredString("Name").max(150),
  phone: zPhone,
  email: zEmail,
  postcode: zPostcode,
  address: zRequiredString("Address").max(300),
});

export const zBusinessEnquiryBase = z.object({
  name: zRequiredString("Name").max(150),
  email: zEmail,
  phone: zPhone,
  businessType: zRequiredString("Business type").max(100),
});

export const zBlogBase = z.object({
  title: zRequiredString("Title").max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens")
    .min(1, "Slug is required"),
  content: zRequiredString("Content"),
  publishedAt: zIsoDate.optional(),
});

export const zCmsPageBase = z.object({
  slug: zRequiredString("Slug").max(100),
  title: zRequiredString("Title").max(200),
  content: zRequiredString("Content"),
});


export const zSeoBase = z.object({
  pageSlug: zRequiredString("Page slug"),
  title: zRequiredString("SEO title").max(70),
  description: zRequiredString("Meta description").max(160),
  keywords: z.array(z.string()).max(20).optional(),
});

export const zTemplateBase = z.object({
  name: zRequiredString("Template name").max(100),
  channel: zNotificationChannel,
  subject: z.string().trim().max(200).optional(),
  body: zRequiredString("Body").max(5000),
});

export const zSliderBase = z.object({
  title: zRequiredString("Title").max(150),
  description: z.string().trim().max(500).optional(),
  buttonName: zRequiredString("Button label").max(50),
});

export const zMediaWallBase = z.object({
  title: zRequiredString("Title").max(150),
  description: z.string().trim().max(500).optional(),
});

export const zFinanceBase = z.object({
  title: zRequiredString("Title").max(200),
  description: zRequiredString("Description").max(500),
  content: zRequiredString("Content"),
});


export const zReviewBase = z.object({
  name: zRequiredString("Customer name").max(150),
  description: zRequiredString("Review content").max(2000),
});



export const zPaginationParams = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const zProductFilterParams = zPaginationParams.extend({
  category: zProductCategory.optional(),
  colourId: z.string().uuid().optional(),
  style: zStyle.optional(),
  finish: zFinish.optional(),
  rangeId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const zAppointmentFilterParams = zPaginationParams.extend({
  type: zAppointmentType.optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  dateFrom: zDateString.optional(),
  dateTo: zDateString.optional(),
});


export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.errors.map((e) => [e.path.join("."), e.message]),
  );
}