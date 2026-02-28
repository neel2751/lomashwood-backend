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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/hooks/useSettings";
import {
  Save,
  Loader2,
  Shield,
  Lock,
  Clock,
  Network,
  KeyRound,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

const securitySettingsSchema = z.object({
  // Password policy
  minPasswordLength: z.number().int().min(8).max(32),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  passwordExpiryDays: z.number().int().min(0).max(365),
  preventPasswordReuse: z.number().int().min(0).max(24),

  // Session
  sessionTimeoutMinutes: z.number().int().min(5).max(1440),
  maxConcurrentSessions: z.number().int().min(1).max(20),
  rememberMeDays: z.number().int().min(1).max(90),
  forceLogoutOnPasswordChange: z.boolean(),

  // 2FA
  twoFactorRequired: z.boolean(),
  twoFactorMethods: z.array(z.string()),

  // Login protection
  maxLoginAttempts: z.number().int().min(3).max(20),
  lockoutDurationMinutes: z.number().int().min(1).max(1440),
  loginRateLimitEnabled: z.boolean(),

  // IP allowlist
  ipAllowlistEnabled: z.boolean(),
  ipAllowlist: z.string(),

  // Audit
  auditLogRetentionDays: z.number().int().min(30).max(3650),
  sensitiveActionNotifications: z.boolean(),
  notifyOnNewAdminLogin: z.boolean(),
  securityAlertEmail: z.string().email().optional().or(z.literal("")),
});

type SecuritySettingsData = z.infer<typeof securitySettingsSchema>;

function SecuritySection({
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

function ToggleRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm font-medium leading-none">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SecuritySettingsForm() {
  const { data: settings, isLoading, updateSettings, isSubmitting } = useSettings("security");
  const [saved, setSaved] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [showPasswordTest, setShowPasswordTest] = useState(false);
  const [testPassword, setTestPassword] = useState("");

  const form = useForm<SecuritySettingsData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      minPasswordLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiryDays: 90,
      preventPasswordReuse: 5,
      sessionTimeoutMinutes: 120,
      maxConcurrentSessions: 3,
      rememberMeDays: 30,
      forceLogoutOnPasswordChange: true,
      twoFactorRequired: false,
      twoFactorMethods: ["totp"],
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      loginRateLimitEnabled: true,
      ipAllowlistEnabled: false,
      ipAllowlist: "",
      auditLogRetentionDays: 365,
      sensitiveActionNotifications: true,
      notifyOnNewAdminLogin: true,
      securityAlertEmail: "",
    },
  });

  useEffect(() => {
    if (settings) form.reset(settings);
  }, [settings]);

  const onSubmit = async (data: SecuritySettingsData) => {
    await updateSettings("security", data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const watchMinLength = form.watch("minPasswordLength");
  const watchIpAllowlist = form.watch("ipAllowlist");
  const ipList = watchIpAllowlist
    ? watchIpAllowlist.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  const addIp = () => {
    const trimmed = newIp.trim();
    if (!trimmed || ipList.includes(trimmed)) return;
    form.setValue("ipAllowlist", [...ipList, trimmed].join("\n"));
    setNewIp("");
  };

  const removeIp = (ip: string) => {
    form.setValue("ipAllowlist", ipList.filter((i) => i !== ip).join("\n"));
  };

  // Simple password strength check against current policy
  const watchSettings = form.watch();
  const testPasswordStrength = (pw: string) => {
    const checks = [
      { label: `Min ${watchSettings.minPasswordLength} chars`, pass: pw.length >= watchSettings.minPasswordLength },
      { label: "Uppercase", pass: !watchSettings.requireUppercase || /[A-Z]/.test(pw) },
      { label: "Lowercase", pass: !watchSettings.requireLowercase || /[a-z]/.test(pw) },
      { label: "Number", pass: !watchSettings.requireNumbers || /\d/.test(pw) },
      { label: "Special char", pass: !watchSettings.requireSpecialChars || /[^a-zA-Z0-9]/.test(pw) },
    ];
    return checks;
  };

  const passwordChecks = testPasswordStrength(testPassword);
  const allPassing = passwordChecks.every((c) => c.pass);

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

        {/* Password Policy */}
        <SecuritySection
          icon={<Lock className="h-4 w-4" />}
          title="Password Policy"
          description="Requirements enforced when admin users set or change their password."
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="minPasswordLength"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Minimum Length</FormLabel>
                    <Badge variant="secondary" className="text-sm font-mono">{watchMinLength} chars</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      min={8}
                      max={32}
                      step={1}
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {[
              { name: "requireUppercase" as const, label: "Require uppercase letters (A–Z)" },
              { name: "requireLowercase" as const, label: "Require lowercase letters (a–z)" },
              { name: "requireNumbers" as const, label: "Require numbers (0–9)" },
              { name: "requireSpecialChars" as const, label: "Require special characters (!@#$…)" },
            ].map((item, idx, arr) => (
              <div key={item.name}>
                <FormField
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem>
                      <ToggleRow label={item.label}>
                        <FormControl>
                          <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                        </FormControl>
                      </ToggleRow>
                    </FormItem>
                  )}
                />
                {idx < arr.length - 1 && <Separator />}
              </div>
            ))}

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="passwordExpiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Expiry (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Set to 0 to disable expiry.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preventPasswordReuse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prevent Password Reuse</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Number of previous passwords to reject.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password tester */}
            <Separator />
            <div>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                onClick={() => setShowPasswordTest(!showPasswordTest)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {showPasswordTest ? "Hide" : "Test"} password against policy
              </button>
              {showPasswordTest && (
                <div className="mt-3 space-y-3">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Type a password to test…"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  {testPassword && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {passwordChecks.map((check) => (
                        <div
                          key={check.label}
                          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
                            check.pass
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {check.pass ? (
                            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <X className="h-3 w-3 flex-shrink-0" />
                          )}
                          {check.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SecuritySection>

        {/* Session Management */}
        <SecuritySection
          icon={<Clock className="h-4 w-4" />}
          title="Session Management"
          description="Control how long admin sessions stay active and concurrent limits."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="sessionTimeoutMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Timeout (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={1440}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 120)}
                    />
                  </FormControl>
                  <FormDescription>Inactivity timeout. 0 = never.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxConcurrentSessions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Concurrent Sessions</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                    />
                  </FormControl>
                  <FormDescription>Per user, across all devices.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rememberMeDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remember Me (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="forceLogoutOnPasswordChange"
            render={({ field }) => (
              <FormItem>
                <ToggleRow
                  label="Force logout on password change"
                  description="Revoke all other active sessions when a user changes their password."
                >
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </ToggleRow>
              </FormItem>
            )}
          />
        </SecuritySection>

        {/* Two-Factor Authentication */}
        <SecuritySection
          icon={<Smartphone className="h-4 w-4" />}
          title="Two-Factor Authentication"
          description="Add an extra layer of verification for admin logins."
        >
          <FormField
            control={form.control}
            name="twoFactorRequired"
            render={({ field }) => (
              <FormItem>
                <ToggleRow
                  label="Require 2FA for all admin users"
                  description="Users who haven't set up 2FA will be prompted on next login."
                >
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </ToggleRow>
              </FormItem>
            )}
          />

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Allowed 2FA methods</p>
            <FormField
              control={form.control}
              name="twoFactorMethods"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "totp", label: "Authenticator App (TOTP)" },
                      { value: "sms", label: "SMS" },
                      { value: "email", label: "Email OTP" },
                    ].map((method) => {
                      const selected = field.value.includes(method.value);
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              field.onChange(field.value.filter((v) => v !== method.value));
                            } else {
                              field.onChange([...field.value, method.value]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                          }`}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SecuritySection>

        {/* Login Protection */}
        <SecuritySection
          icon={<Shield className="h-4 w-4" />}
          title="Login Protection"
          description="Brute-force protection and rate limiting for the admin login page."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxLoginAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Failed Attempts</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={3}
                      max={20}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                    />
                  </FormControl>
                  <FormDescription>Before account lockout is triggered.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lockoutDurationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lockout Duration (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="loginRateLimitEnabled"
            render={({ field }) => (
              <FormItem>
                <ToggleRow
                  label="Enable rate limiting"
                  description="Slow down login attempts from suspicious IPs."
                >
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </ToggleRow>
              </FormItem>
            )}
          />
        </SecuritySection>

        {/* IP Allowlist */}
        <SecuritySection
          icon={<Network className="h-4 w-4" />}
          title="IP Allowlist"
          description="Restrict admin access to specific IP addresses or CIDR ranges."
        >
          <FormField
            control={form.control}
            name="ipAllowlistEnabled"
            render={({ field }) => (
              <FormItem>
                <ToggleRow
                  label="Enable IP allowlist"
                  description="Only allow logins from the IPs listed below."
                >
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </ToggleRow>
              </FormItem>
            )}
          />

          {form.watch("ipAllowlistEnabled") && (
            <>
              <Separator />
              <div className="space-y-3">
                {ipList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ipList.map((ip) => (
                      <Badge key={ip} variant="secondary" className="gap-1.5 font-mono text-xs pr-1">
                        {ip}
                        <button
                          type="button"
                          onClick={() => removeIp(ip)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="192.168.1.0/24 or 203.0.113.5"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIp(); } }}
                    className="font-mono text-sm"
                  />
                  <Button type="button" variant="outline" onClick={addIp}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="ipAllowlist"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={3}
                          className="font-mono text-xs"
                          placeholder={"192.168.1.0/24\n10.0.0.1\n203.0.113.5"}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>One IP or CIDR per line.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Make sure your current IP is included before saving, or you may be locked out.
                </div>
              </div>
            </>
          )}
        </SecuritySection>

        {/* Audit & Alerts */}
        <SecuritySection
          icon={<KeyRound className="h-4 w-4" />}
          title="Audit & Security Alerts"
          description="Log retention and email notifications for security-sensitive events."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="auditLogRetentionDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Log Retention (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={30}
                      max={3650}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 365)}
                    />
                  </FormControl>
                  <FormDescription>Logs older than this will be purged.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="securityAlertEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security Alert Email</FormLabel>
                  <FormControl><Input type="email" placeholder="security@lomashwood.co.uk" {...field} /></FormControl>
                  <FormDescription>Where security alerts are sent.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {[
            {
              name: "sensitiveActionNotifications" as const,
              label: "Notify on sensitive actions",
              desc: "Email alerts when roles are modified, users deleted, or settings changed.",
            },
            {
              name: "notifyOnNewAdminLogin" as const,
              label: "Notify on new admin login",
              desc: "Email alert when an admin logs in from a new device or IP.",
            },
          ].map((item, idx, arr) => (
            <div key={item.name}>
              <FormField
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem>
                    <ToggleRow label={item.label} description={item.desc}>
                      <FormControl>
                        <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                      </FormControl>
                    </ToggleRow>
                  </FormItem>
                )}
              />
              {idx < arr.length - 1 && <Separator />}
            </div>
          ))}
        </SecuritySection>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Security settings saved
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