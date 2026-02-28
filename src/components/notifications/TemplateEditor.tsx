"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  MessageSquare,
  Smartphone,
  Eye,
  Code2,
  Plus,
  X,
  Info,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTemplates } from "@/hooks/useTemplates";
import { templateSchema } from "@/schemas/template.schema";
import { type NotificationChannel } from "@/types/notification.types";



type TemplateFormData = z.infer<typeof templateSchema>;

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string; icon: React.ReactNode }[] = [
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { value: "sms", label: "SMS", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "push", label: "Push Notification", icon: <Smartphone className="h-4 w-4" /> },
];

// Common variables for Lomash Wood notification templates
const SUGGESTED_VARIABLES: Record<NotificationChannel, string[]> = {
  email: [
    "customer_name",
    "appointment_date",
    "appointment_time",
    "appointment_type",
    "showroom_name",
    "showroom_address",
    "order_id",
    "order_total",
    "brochure_link",
    "company_name",
    "support_email",
  ],
  sms: [
    "customer_name",
    "appointment_date",
    "appointment_time",
    "showroom_name",
    "company_name",
    "support_phone",
  ],
  push: [
    "customer_name",
    "appointment_date",
    "order_id",
    "offer_title",
  ],
};

interface TemplateEditorProps {
  templateId?: string;
}

export function TemplateEditor({ templateId }: TemplateEditorProps) {
  const router = useRouter();
  const isEditing = !!templateId;

  const { getTemplate, createTemplate, updateTemplate, isSubmitting } = useTemplates();
  const [newVariable, setNewVariable] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      channel: "email",
      subject: "",
      body: "",
      htmlBody: "",
      variables: [],
      isActive: true,
    },
  });

  const selectedChannel = form.watch("channel") as NotificationChannel;
  const watchedBody = form.watch("body");
  const watchedHtmlBody = form.watch("htmlBody");
  const watchedVariables = form.watch("variables") ?? [];

  // Load existing template for editing
  useEffect(() => {
    if (isEditing) {
      getTemplate(templateId).then((tpl) => {
        if (tpl) {
          form.reset({
            name: tpl.name,
            description: tpl.description ?? "",
            channel: tpl.channel,
            subject: tpl.subject ?? "",
            body: tpl.body ?? "",
            htmlBody: tpl.htmlBody ?? "",
            variables: tpl.variables ?? [],
            isActive: tpl.isActive,
          });
        }
      });
    }
  }, [templateId, isEditing]);

  const onSubmit = async (data: TemplateFormData) => {
    if (isEditing) {
      await updateTemplate(templateId, data);
    } else {
      await createTemplate(data);
    }
    router.push("/notifications/templates");
  };

  const addVariable = (varName?: string) => {
    const variable = varName ?? newVariable.trim().replace(/\s+/g, "_").toLowerCase();
    if (!variable || watchedVariables.includes(variable)) return;
    form.setValue("variables", [...watchedVariables, variable]);
    setNewVariable("");
  };

  const removeVariable = (varName: string) => {
    form.setValue("variables", watchedVariables.filter((v) => v !== varName));
  };

  // Auto-detect variables from body content
  const detectVariables = () => {
    const body = watchedBody + " " + watchedHtmlBody;
    const matches = [...body.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    const unique = Array.from(new Set(matches));
    const combined = Array.from(new Set([...watchedVariables, ...unique]));
    form.setValue("variables", combined);
  };

  const suggestedVars = SUGGESTED_VARIABLES[selectedChannel].filter(
    (v) => !watchedVariables.includes(v)
  );

  // Simple preview with variable substitution
  const getPreviewContent = (content: string) => {
    let preview = content;
    watchedVariables.forEach((v) => {
      preview = preview.replaceAll(`{{${v}}}`, `[${v.toUpperCase()}]`);
    });
    return preview;
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Templates
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: Main editor */}
            <div className="lg:col-span-2 space-y-4">

              {/* Core fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Appointment Confirmation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="channel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CHANNEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    {opt.icon}
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of when this template is used"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Content editor */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Content</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      {previewMode ? (
                        <><Code2 className="h-4 w-4 mr-1.5" />Edit</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-1.5" />Preview</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subject (email + push only) */}
                  {(selectedChannel === "email" || selectedChannel === "push") && (
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {selectedChannel === "email" ? "Subject Line" : "Notification Title"} *
                          </FormLabel>
                          <FormControl>
                            {previewMode ? (
                              <div className="min-h-[40px] rounded-md border bg-muted/30 px-3 py-2 text-sm">
                                {getPreviewContent(field.value ?? "") || (
                                  <span className="text-muted-foreground italic">Empty subject</span>
                                )}
                              </div>
                            ) : (
                              <Input
                                placeholder={
                                  selectedChannel === "email"
                                    ? "Your appointment is confirmed — {{appointment_date}}"
                                    : "Appointment Reminder"
                                }
                                {...field}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Plain text body */}
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedChannel === "email" ? "Plain Text Body" : "Message Body"} *
                        </FormLabel>
                        <FormControl>
                          {previewMode ? (
                            <div className="min-h-[160px] rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
                              {getPreviewContent(field.value ?? "") || (
                                <span className="text-muted-foreground italic">Empty body</span>
                              )}
                            </div>
                          ) : (
                            <Textarea
                              rows={selectedChannel === "sms" ? 4 : 8}
                              placeholder={
                                selectedChannel === "sms"
                                  ? "Hi {{customer_name}}, your appointment is on {{appointment_date}} at {{appointment_time}}. — Lomash Wood"
                                  : "Hi {{customer_name}},\n\nYour appointment has been confirmed for {{appointment_date}} at {{appointment_time}}.\n\nThank you,\nThe Lomash Wood Team"
                              }
                              {...field}
                            />
                          )}
                        </FormControl>
                        {selectedChannel === "sms" && (
                          <FormDescription>
                            SMS messages are charged per 160-character segment.
                            Current length: {(field.value ?? "").length} chars
                            (~{Math.ceil((field.value ?? "").length / 160)} segment
                            {Math.ceil((field.value ?? "").length / 160) !== 1 ? "s" : ""})
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* HTML body (email only) */}
                  {selectedChannel === "email" && (
                    <FormField
                      control={form.control}
                      name="htmlBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HTML Body</FormLabel>
                          <FormControl>
                            {previewMode ? (
                              <div
                                className="min-h-[200px] rounded-md border bg-white px-4 py-3 text-sm prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: getPreviewContent(field.value ?? "") || "<p><em>No HTML content</em></p>",
                                }}
                              />
                            ) : (
                              <Tabs defaultValue="code">
                                <TabsList className="mb-2">
                                  <TabsTrigger value="code">HTML</TabsTrigger>
                                  <TabsTrigger value="render">Render</TabsTrigger>
                                </TabsList>
                                <TabsContent value="code">
                                  <Textarea
                                    rows={12}
                                    className="font-mono text-xs"
                                    placeholder="<p>Hi {{customer_name}},</p>..."
                                    {...field}
                                  />
                                </TabsContent>
                                <TabsContent value="render">
                                  <div
                                    className="min-h-[200px] rounded-md border bg-white px-4 py-3 text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: field.value ?? "" }}
                                  />
                                </TabsContent>
                              </Tabs>
                            )}
                          </FormControl>
                          <FormDescription>
                            Optional. If provided, HTML version will be sent alongside plain text.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Settings + Variables */}
            <div className="space-y-4">
              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Active</FormLabel>
                          <FormDescription className="text-xs mt-0.5">
                            Inactive templates won't be used for sending.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Variables */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Variables
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={detectVariables}
                    >
                      Auto-detect
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-2.5 py-2">
                    <Info className="h-3.5 w-3.5 flex-shrink-0" />
                    Use <code className="mx-1 font-mono">{"{{variable}}"}</code> syntax in content.
                  </div>

                  {/* Current variables */}
                  {watchedVariables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {watchedVariables.map((v) => (
                        <Badge
                          key={v}
                          variant="secondary"
                          className="gap-1 font-mono text-xs pr-1"
                        >
                          {`{{${v}}}`}
                          <button
                            type="button"
                            onClick={() => removeVariable(v)}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add custom variable */}
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="variable_name"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addVariable(); }
                      }}
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => addVariable()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Suggestions */}
                  {suggestedVars.length > 0 && (
                    <div>
                      <Separator className="mb-2.5" />
                      <p className="text-xs text-muted-foreground mb-2">Suggested for {selectedChannel}:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestedVars.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => addVariable(v)}
                            className="text-xs font-mono px-2 py-0.5 rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
                          >
                            + {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />{isEditing ? "Update Template" : "Create Template"}</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}