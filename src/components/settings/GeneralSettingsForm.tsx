"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useSettings";
import {
  Save,
  Loader2,
  Globe,
  Building2,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Palette,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  tagline: z.string().optional(),
  contactEmail: z.string().email("Must be a valid email"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  country: z.string().default("GB"),
  siteUrl: z.string().url("Must be a valid URL"),
  adminUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  supportEmail: z.string().email("Must be a valid email"),
  noReplyEmail: z.string().email("Must be a valid email"),
  timezone: z.string().default("Europe/London"),
  currency: z.string().default("GBP"),
  dateFormat: z.string().default("DD/MM/YYYY"),
  language: z.string().default("en-GB"),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColour: z.string().default("#1a1a1a"),
  maintenanceMode: z.boolean().default(false),
  bookingsEnabled: z.boolean().default(true),
  brochureEnabled: z.boolean().default(true),
  financeEnabled: z.boolean().default(true),
  loyaltyEnabled: z.boolean().default(true),
  vatNumber: z.string().optional(),
  companyNumber: z.string().optional(),
  termsUrl: z.string().optional(),
  privacyUrl: z.string().optional(),
  cookiesUrl: z.string().optional(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;

const TIMEZONES = [
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2024)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2024)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-12-31)" },
];

const CURRENCIES = [
  { value: "GBP", label: "GBP (£)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
];

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function GeneralSettingsForm() {
  const { data: settings, isLoading, updateSettings, isSubmitting } = useSettings("general");
  const [saved, setSaved] = useState(false);

  const form = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "Lomash Wood",
      tagline: "Beautiful Kitchens & Bedrooms",
      contactEmail: "info@lomashwood.co.uk",
      contactPhone: "",
      address: "",
      city: "",
      postcode: "",
      country: "GB",
      siteUrl: "https://lomashwood.co.uk",
      adminUrl: "https://admin.lomashwood.co.uk",
      supportEmail: "support@lomashwood.co.uk",
      noReplyEmail: "noreply@lomashwood.co.uk",
      timezone: "Europe/London",
      currency: "GBP",
      dateFormat: "DD/MM/YYYY",
      language: "en-GB",
      logoUrl: "",
      faviconUrl: "",
      primaryColour: "#1a1a1a",
      maintenanceMode: false,
      bookingsEnabled: true,
      brochureEnabled: true,
      financeEnabled: true,
      loyaltyEnabled: true,
      vatNumber: "",
      companyNumber: "",
      termsUrl: "",
      privacyUrl: "",
      cookiesUrl: "",
    },
  });

  useEffect(() => {
    if (settings) form.reset(settings);
  }, [settings]);

  const onSubmit = async (data: GeneralSettingsData) => {
    await updateSettings("general", data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Company Information */}
        <SettingsSection
          icon={<Building2 className="h-4 w-4" />}
          title="Company Information"
          description="Your business details displayed across the platform and customer communications."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl><Input placeholder="Beautiful Kitchens & Bedrooms" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" type="email" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" type="tel" placeholder="+44 20 0000 0000" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea className="pl-9 resize-none" rows={2} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postcode *</FormLabel>
                  <FormControl><Input placeholder="SW1A 1AA" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Number</FormLabel>
                  <FormControl><Input placeholder="GB 000 0000 00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Companies House Number</FormLabel>
                  <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SettingsSection>

        {/* Site & Email */}
        <SettingsSection
          icon={<Globe className="h-4 w-4" />}
          title="Site & Email"
          description="URLs and email addresses used across automated communications."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="siteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL *</FormLabel>
                  <FormControl><Input placeholder="https://lomashwood.co.uk" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin URL</FormLabel>
                  <FormControl><Input placeholder="https://admin.lomashwood.co.uk" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="supportEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Email *</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormDescription>Shown in customer-facing emails.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noReplyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No-Reply Email *</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormDescription>Sender address for automated notifications.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />
          <p className="text-sm font-medium">Legal Pages</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                { name: "termsUrl" as const, label: "Terms & Conditions" },
                { name: "privacyUrl" as const, label: "Privacy Policy" },
                { name: "cookiesUrl" as const, label: "Cookie Policy" },
              ]
            ).map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{item.label} URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="https://..." {...field} />
                        {field.value && (
                          <a
                            href={field.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </SettingsSection>

        {/* Locale */}
        <SettingsSection
          icon={<Clock className="h-4 w-4" />}
          title="Localisation"
          description="Regional settings for dates, currency and language."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Format</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {DATE_FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SettingsSection>

        {/* Branding */}
        <SettingsSection
          icon={<Palette className="h-4 w-4" />}
          title="Branding"
          description="Logo, favicon, and brand colour used across admin communications."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <Input placeholder="https://..." {...field} />
                      {field.value && (
                        <img src={field.value} alt="Logo preview" className="h-9 w-9 object-contain border rounded flex-shrink-0" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faviconUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon URL</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <Input placeholder="https://..." {...field} />
                      {field.value && (
                        <img src={field.value} alt="Favicon preview" className="h-9 w-9 object-contain border rounded flex-shrink-0" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="primaryColour"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Primary Brand Colour</FormLabel>
                <FormControl>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-9 w-16 rounded border cursor-pointer p-0.5"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="font-mono max-w-[120px]"
                      placeholder="#1a1a1a"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsSection>

        {/* Feature Flags */}
        <SettingsSection
          icon={<CreditCard className="h-4 w-4" />}
          title="Feature Flags"
          description="Enable or disable site features without a code deployment."
        >
          <div className="space-y-1">
            {[
              {
                name: "maintenanceMode" as const,
                label: "Maintenance Mode",
                desc: "Takes the public site offline and shows a maintenance page to visitors.",
                danger: true,
              },
              {
                name: "bookingsEnabled" as const,
                label: "Appointment Booking",
                desc: "Allow customers to book home, online, and showroom consultations.",
              },
              {
                name: "brochureEnabled" as const,
                label: "Brochure Requests",
                desc: "Allow customers to request a physical brochure.",
              },
              {
                name: "financeEnabled" as const,
                label: "Finance Options",
                desc: "Show the finance section and payment plan information on the site.",
              },
              {
                name: "loyaltyEnabled" as const,
                label: "Loyalty Programme",
                desc: "Enable the customer loyalty points system.",
              },
            ].map((item, idx, arr) => (
              <div key={item.name}>
                <FormField
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between gap-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium leading-none cursor-pointer">
                            {item.label}
                          </FormLabel>
                          {item.danger && field.value && (
                            <Badge variant="destructive" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <FormDescription className="text-xs">{item.desc}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          className={item.danger && field.value ? "data-[state=checked]:bg-destructive" : ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {idx < arr.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Settings saved
            </span>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}