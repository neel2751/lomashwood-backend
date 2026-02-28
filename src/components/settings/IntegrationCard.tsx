"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings2,
  Unplug,
  Plug,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useIntegrations } from "@/hooks/useIntegrations";


// ── Integration catalogue ─────────────────────────────────────────────────────

export type IntegrationId =
  | "google_tag_manager"
  | "google_search_console"
  | "google_analytics"
  | "stripe"
  | "sendgrid"
  | "twilio"
  | "firebase_push"
  | "recaptcha"
  | "mapbox"
  | "cloudinary"
  | "hubspot";

interface IntegrationMeta {
  id: IntegrationId;
  name: string;
  description: string;
  category: string;
  docsUrl?: string;
  logo: string; // emoji stand-in; swap for <img> with real logos
  fields: {
    key: string;
    label: string;
    type?: "text" | "password";
    placeholder?: string;
    description?: string;
    required?: boolean;
  }[];
}

const INTEGRATIONS: IntegrationMeta[] = [
  {
    id: "google_tag_manager",
    name: "Google Tag Manager",
    description: "Deploy and manage analytics tags without code changes. Required per SRS NFR4.2.",
    category: "Analytics",
    docsUrl: "https://tagmanager.google.com",
    logo: "📊",
    fields: [
      {
        key: "containerId",
        label: "Container ID",
        placeholder: "GTM-XXXXXXX",
        description: "Found in your GTM dashboard under Workspace.",
        required: true,
      },
    ],
  },
  {
    id: "google_search_console",
    name: "Google Search Console",
    description: "Verify site ownership and monitor search performance. Required per SRS NFR4.2.",
    category: "Analytics",
    docsUrl: "https://search.google.com/search-console",
    logo: "🔍",
    fields: [
      {
        key: "verificationCode",
        label: "Meta Verification Code",
        placeholder: "google1234567890abcdef.html",
        description: "The content attribute value of the Google site verification meta tag.",
        required: true,
      },
    ],
  },
  {
    id: "google_analytics",
    name: "Google Analytics 4",
    description: "Track user behaviour, traffic, and conversion events across the website.",
    category: "Analytics",
    docsUrl: "https://analytics.google.com",
    logo: "📈",
    fields: [
      {
        key: "measurementId",
        label: "Measurement ID",
        placeholder: "G-XXXXXXXXXX",
        required: true,
      },
      {
        key: "apiSecret",
        label: "API Secret (for server-side events)",
        type: "password",
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Process payments, manage subscriptions, and handle refunds for kitchen and bedroom orders.",
    category: "Payments",
    docsUrl: "https://dashboard.stripe.com",
    logo: "💳",
    fields: [
      {
        key: "publishableKey",
        label: "Publishable Key",
        placeholder: "pk_live_…",
        required: true,
      },
      {
        key: "secretKey",
        label: "Secret Key",
        type: "password",
        placeholder: "sk_live_…",
        required: true,
      },
      {
        key: "webhookSecret",
        label: "Webhook Signing Secret",
        type: "password",
        placeholder: "whsec_…",
        description: "Used to verify incoming webhook events from Stripe.",
      },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Transactional and marketing email delivery — appointment confirmations, brochure requests, and booking acknowledgements.",
    category: "Email",
    docsUrl: "https://app.sendgrid.com",
    logo: "✉️",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "SG.••••••",
        required: true,
      },
      {
        key: "fromEmail",
        label: "Default From Email",
        placeholder: "noreply@lomashwood.co.uk",
        required: true,
      },
      {
        key: "fromName",
        label: "Default From Name",
        placeholder: "Lomash Wood",
      },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS notifications for appointment reminders, booking confirmations, and internal alerts.",
    category: "SMS",
    docsUrl: "https://console.twilio.com",
    logo: "💬",
    fields: [
      {
        key: "accountSid",
        label: "Account SID",
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        required: true,
      },
      {
        key: "authToken",
        label: "Auth Token",
        type: "password",
        placeholder: "••••••••",
        required: true,
      },
      {
        key: "fromNumber",
        label: "From Number",
        placeholder: "+441234567890",
        required: true,
      },
    ],
  },
  {
    id: "firebase_push",
    name: "Firebase Cloud Messaging",
    description: "Push notifications to mobile and web app users.",
    category: "Push",
    docsUrl: "https://console.firebase.google.com",
    logo: "🔔",
    fields: [
      {
        key: "projectId",
        label: "Project ID",
        placeholder: "lomash-wood",
        required: true,
      },
      {
        key: "serverKey",
        label: "Server Key",
        type: "password",
        placeholder: "••••••••",
        required: true,
      },
      {
        key: "vapidKey",
        label: "VAPID Key (Web Push)",
        placeholder: "BN…",
      },
    ],
  },
  {
    id: "recaptcha",
    name: "Google reCAPTCHA v3",
    description: "Protect contact, booking, and brochure forms from spam and bots.",
    category: "Security",
    docsUrl: "https://www.google.com/recaptcha/admin",
    logo: "🤖",
    fields: [
      {
        key: "siteKey",
        label: "Site Key",
        placeholder: "6L…",
        required: true,
      },
      {
        key: "secretKey",
        label: "Secret Key",
        type: "password",
        placeholder: "6L…",
        required: true,
      },
    ],
  },
  {
    id: "mapbox",
    name: "Mapbox",
    description: "Interactive maps for the Find a Showroom page and individual showroom detail pages.",
    category: "Maps",
    docsUrl: "https://account.mapbox.com",
    logo: "🗺️",
    fields: [
      {
        key: "accessToken",
        label: "Access Token",
        placeholder: "pk.ey…",
        required: true,
      },
    ],
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    description: "Cloud image and video hosting for product photos, media wall, and CMS assets.",
    category: "Media",
    docsUrl: "https://cloudinary.com/console",
    logo: "🖼️",
    fields: [
      {
        key: "cloudName",
        label: "Cloud Name",
        placeholder: "lomash-wood",
        required: true,
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "123456789012345",
        required: true,
      },
      {
        key: "apiSecret",
        label: "API Secret",
        type: "password",
        placeholder: "••••••••",
        required: true,
      },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    description: "Sync customer enquiries, appointments, and brochure leads into HubSpot.",
    category: "CRM",
    docsUrl: "https://app.hubspot.com",
    logo: "🧩",
    fields: [
      {
        key: "accessToken",
        label: "Private App Access Token",
        type: "password",
        placeholder: "pat-na1-…",
        required: true,
      },
      {
        key: "portalId",
        label: "Portal ID",
        placeholder: "12345678",
      },
    ],
  },
];

const CATEGORIES = [...new Set(INTEGRATIONS.map((i) => i.category))];

const STATUS_CONFIG = {
  connected: {
    label: "Connected",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  disconnected: {
    label: "Not connected",
    style: "bg-muted text-muted-foreground",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  error: {
    label: "Error",
    style: "bg-red-50 text-red-700 border-red-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

// ── Single card ───────────────────────────────────────────────────────────────

interface IntegrationCardProps {
  integration: IntegrationMeta;
  status: "connected" | "disconnected" | "error";
  enabled: boolean;
  onToggle: (id: IntegrationId, enabled: boolean) => void;
  onSave: (id: IntegrationId, values: Record<string, string>) => Promise<void>;
  onTest: (id: IntegrationId) => Promise<void>;
  onDisconnect: (id: IntegrationId) => Promise<void>;
}

function IntegrationCardItem({
  integration,
  status,
  enabled,
  onToggle,
  onSave,
  onTest,
  onDisconnect,
}: IntegrationCardProps) {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const schema = z.object(
    Object.fromEntries(
      integration.fields.map((f) => [
        f.key,
        f.required ? z.string().min(1, `${f.label} is required`) : z.string().optional(),
      ])
    )
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(integration.fields.map((f) => [f.key, ""])),
  });

  const statusCfg = STATUS_CONFIG[status];

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await onTest(integration.id);
      setTestResult("success");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <>
      <Card className={`transition-opacity ${!enabled && status === "connected" ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">{integration.logo}</span>
              <div>
                <CardTitle className="text-sm font-semibold">{integration.name}</CardTitle>
                <CardDescription className="text-xs mt-1 leading-relaxed">
                  {integration.description}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => onToggle(integration.id, v)}
              className="flex-shrink-0"
            />
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-xs flex items-center gap-1 ${statusCfg.style}`}
            >
              {statusCfg.icon}
              {statusCfg.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">{integration.category}</Badge>
          </div>
        </CardContent>

        <CardFooter className="gap-2 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setOpen(true)}
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            Configure
          </Button>
          {status === "connected" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : testResult === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : testResult === "error" ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {integration.docsUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Config dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{integration.logo}</span>
              {integration.name}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials from the {integration.name} dashboard.
              {integration.docsUrl && (
                <a
                  href={integration.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-1 text-primary hover:underline"
                >
                  View docs <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async (data) => {
                await onSave(integration.id, data as Record<string, string>);
                setOpen(false);
              })}
              className="space-y-4"
            >
              {integration.fields.map((f) => (
                <FormField
                  key={f.key}
                  control={form.control}
                  name={f.key}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {f.label}
                        {f.required && <span className="text-destructive ml-0.5">*</span>}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={f.type === "password" && !showValues[f.key] ? "password" : "text"}
                            placeholder={f.placeholder}
                            {...field}
                          />
                          {f.type === "password" && (
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setShowValues((prev) => ({ ...prev, [f.key]: !prev[f.key] }))
                              }
                            >
                              {showValues[f.key] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </FormControl>
                      {f.description && <FormDescription>{f.description}</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <Separator />

              <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
                {status === "connected" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive mr-auto"
                    onClick={async () => {
                      await onDisconnect(integration.id);
                      setOpen(false);
                    }}
                  >
                    <Unplug className="h-3.5 w-3.5 mr-1.5" />
                    Disconnect
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Plug className="h-4 w-4 mr-1.5" />
                  {status === "connected" ? "Update" : "Connect"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Page-level integration grid ───────────────────────────────────────────────

export function IntegrationCard() {
  const { data, toggleIntegration, saveIntegration, testIntegration, disconnectIntegration } =
    useIntegrations();

  const getStatus = (id: IntegrationId): "connected" | "disconnected" | "error" =>
    data?.[id]?.status ?? "disconnected";

  const getEnabled = (id: IntegrationId): boolean => data?.[id]?.enabled ?? false;

  return (
    <div className="space-y-8">
      {CATEGORIES.map((category) => {
        const categoryIntegrations = INTEGRATIONS.filter((i) => i.category === category);
        return (
          <div key={category}>
            <div className="mb-4">
              <h3 className="font-semibold text-sm">{category}</h3>
              <Separator className="mt-2" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryIntegrations.map((integration) => (
                <IntegrationCardItem
                  key={integration.id}
                  integration={integration}
                  status={getStatus(integration.id)}
                  enabled={getEnabled(integration.id)}
                  onToggle={toggleIntegration}
                  onSave={saveIntegration}
                  onTest={testIntegration}
                  onDisconnect={disconnectIntegration}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}