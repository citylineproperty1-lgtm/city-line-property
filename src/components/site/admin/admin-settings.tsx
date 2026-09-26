"use client";

/**
 * Settings tab — WhatsApp webhook (auto-push leads), contact info,
 * change password. Data: GET/PUT /api/admin/settings, POST
 * /api/admin/settings/test, POST /api/admin/password.
 */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import {
  BadgeCheck,
  BellRing,
  CircleSlash,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  KeyRound,
  Loader2,
  Map,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AREA_GUIDES } from "@/lib/areas";
import {
  AdminApi,
  AdminCard,
  BRAND_BTN,
  BRAND_OUTLINE,
  errorMessage,
  fadeUp,
  isAuthLoss,
} from "./admin-shared";

interface Settings {
  webhook_url: string;
  whatsapp_number: string;
  whatsapp_number_2: string;
  office_address: string;
  business_email: string;
  office_hours: string;
}

const EMPTY_SETTINGS: Settings = {
  webhook_url: "",
  whatsapp_number: "",
  whatsapp_number_2: "",
  office_address: "",
  business_email: "",
  office_hours: "",
};

export function AdminSettings({ api }: { api: AdminApi }) {
  const [state, setState] = useState<{ key: string; settings: Settings } | null>(null);
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const key = `settings-${reload}`;

  useEffect(() => {
    let alive = true;
    api<{ settings: Partial<Settings> }>("/api/admin/settings")
      .then((d) => {
        if (alive) setState({ key, settings: { ...EMPTY_SETTINGS, ...d.settings } });
      })
      .catch((err) => {
        if (!alive || isAuthLoss(err)) return;
        setLoadError(errorMessage(err));
        setState({ key, settings: { ...EMPTY_SETTINGS } });
      });
    return () => {
      alive = false;
    };
  }, [key, api]);

  const loading = !state || state.key !== key;
  const settings = state?.key === key ? state.settings : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-5">
      {loadError && (
        <p className="rounded-2xl border border-[#E5484D]/25 bg-[#E5484D]/[0.06] px-4 py-3 text-[13px] text-[#D5303B]">
          {loadError}
        </p>
      )}
      <WebhookCard api={api} settings={settings} onSaved={() => setReload((r) => r + 1)} />
      <ContactCard api={api} settings={settings} onSaved={() => setReload((r) => r + 1)} />
      <AreaMapsCard api={api} />
      <PasswordCard api={api} />
    </div>
  );
}

/* ------------------------------ Webhook card ------------------------------ */

function WebhookCard({
  api,
  settings,
  onSaved,
}: {
  api: AdminApi;
  settings: Settings;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState(settings.webhook_url);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const configured = Boolean(settings.webhook_url);

  const save = async () => {
    setSaving(true);
    try {
      const d = await api<{ ok: boolean; webhookConfigured: boolean }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ webhook_url: url.trim() }),
      });
      toast.success(
        d.webhookConfigured ? "Webhook URL saved" : "Webhook URL cleared"
      );
      onSaved();
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const d = await api<{ ok: boolean; status: string }>("/api/admin/settings/test", {
        method: "POST",
        body: JSON.stringify(url.trim() ? { url: url.trim() } : {}),
      });
      toast.success(`Test message delivered — ${d.status}`);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.section {...fadeUp}>
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E7F4F0] text-[#0B6B5D]">
              <BellRing className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-neutral-900">
                WhatsApp webhook — auto-send leads
              </h3>
              <p className="mt-0.5 text-[12px] text-neutral-400">
                Every new website lead is pushed here automatically.
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
              configured
                ? "border-[#34C759]/30 bg-[#34C759]/10 text-[#1E8E3E]"
                : "border-black/10 bg-black/[0.04] text-neutral-500"
            }`}
          >
            {configured ? (
              <>
                <BadgeCheck className="h-3.5 w-3.5" /> Configured
              </>
            ) : (
              <>
                <CircleSlash className="h-3.5 w-3.5" /> Not configured
              </>
            )}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="webhook-url" className="text-[12px] text-neutral-500">
              Webhook URL
            </Label>
            <Input
              id="webhook-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.callmebot.com/whatsapp.php?phone=923…&text={MESSAGE}&apikey=…"
              className="h-10 rounded-xl border-black/[0.09] font-mono text-[12.5px] focus-visible:ring-[#0F766E]/35"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void save()}
              disabled={saving}
              className={`h-10 rounded-xl px-5 text-[13px] font-semibold ${BRAND_BTN}`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save URL
            </Button>
            <Button
              onClick={() => void test()}
              disabled={testing || (!configured && !url.trim())}
              className={`h-10 rounded-xl px-5 text-[13px] font-semibold ${BRAND_OUTLINE}`}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send test message
            </Button>
          </div>

          <div className="rounded-2xl border border-[#0F766E]/20 bg-[#E7F4F0]/60 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#0B6B5D]">
              <Info className="h-3.5 w-3.5" /> How it works
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[12.5px] leading-relaxed text-neutral-600">
              <li>
                Register your WhatsApp number with{" "}
                <strong>@CallMeBot</strong> (message &ldquo;I allow callmebot to send me
                messages&rdquo; to their bot) to get your personal{" "}
                <code className="rounded bg-white/70 px-1 py-px text-[11px]">apikey</code>.
              </li>
              <li>
                Paste a URL shaped like{" "}
                <code className="mt-0.5 block break-all rounded-lg bg-white/80 px-2 py-1 text-[11px] text-neutral-700">
                  https://api.callmebot.com/whatsapp.php?phone=923094499940&amp;text=
                  {"{MESSAGE}"}&amp;apikey=XXXX
                </code>
              </li>
              <li>
                <code className="text-[11px]">{"{MESSAGE}"}</code> is replaced with the lead brief —
                name, phone, interest and message — before the request is sent.
              </li>
              <li>
                Any Make.com / n8n / Zapier webhook URL also works — those receive a JSON POST with
                the full lead payload instead.
              </li>
            </ol>
          </div>
        </div>
      </AdminCard>
    </motion.section>
  );
}

/* ------------------------------ Contact card ------------------------------ */

const CONTACT_FIELDS: { key: keyof Settings; label: string; placeholder: string; wide?: boolean; mono?: boolean }[] = [
  { key: "whatsapp_number", label: "WhatsApp number (primary)", placeholder: "923094499940", mono: true },
  { key: "whatsapp_number_2", label: "WhatsApp number (secondary)", placeholder: "923218422109", mono: true },
  { key: "office_address", label: "Office address", placeholder: "151-C, Etihad Town Phase 1, Lahore", wide: true },
  { key: "business_email", label: "Business email", placeholder: "citylineproperty1@gmail.com", wide: true },
  { key: "office_hours", label: "Office hours", placeholder: "Mon–Sun · 10:00 AM – 8:00 PM", wide: true },
];

function ContactCard({
  api,
  settings,
  onSaved,
}: {
  api: AdminApi;
  settings: Settings;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          whatsapp_number: form.whatsapp_number.trim(),
          whatsapp_number_2: form.whatsapp_number_2.trim(),
          office_address: form.office_address.trim(),
          business_email: form.business_email.trim(),
          office_hours: form.office_hours.trim(),
        }),
      });
      toast.success("Contact details saved");
      onSaved();
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }}>
      <AdminCard>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E7F4F0] text-[#0B6B5D]">
            <ExternalLink className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Contact information</h3>
            <p className="mt-0.5 text-[12px] text-neutral-400">
              Shown across the public site (header, footer, contact page).
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map((f) => (
            <div key={f.key} className={f.wide ? "sm:col-span-2" : undefined}>
              <Label htmlFor={`set-${f.key}`} className="text-[12px] text-neutral-500">
                {f.label}
              </Label>
              <Input
                id={`set-${f.key}`}
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={`mt-1.5 h-10 rounded-xl border-black/[0.09] text-[13.5px] focus-visible:ring-[#0F766E]/35 ${f.mono ? "font-mono text-[12.5px]" : ""}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => void save()}
            disabled={saving}
            className={`h-10 rounded-xl px-5 text-[13px] font-semibold ${BRAND_BTN}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save contact info
          </Button>
        </div>
      </AdminCard>
    </motion.section>
  );
}

/* ------------------------------ Area maps card ----------------------------- */

const AREA_SLOTS = AREA_GUIDES.map((g) => ({
  slug: g.slug,
  name: g.name,
  key: `area_map_${g.slug}`,
}));

function AreaMapsCard({ api }: { api: AdminApi }) {
  const [paths, setPaths] = useState<Record<string, string> | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ settings: Record<string, string> }>("/api/admin/settings")
      .then((d) => setPaths(d.settings ?? {}))
      .catch((err) => {
        if (!isAuthLoss(err)) setLoadError(errorMessage(err));
      });
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadFor = async (slot: (typeof AREA_SLOTS)[number], file: File) => {
    setBusyKey(slot.key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await api<{ path: string }>("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ [slot.key]: up.path }),
      });
      toast.success(`${slot.name} map saved`);
      load();
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const removeFor = async (slot: (typeof AREA_SLOTS)[number]) => {
    setBusyKey(slot.key);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ [slot.key]: "" }),
      });
      toast.success(`${slot.name} map removed`);
      load();
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.09 }}>
      <AdminCard>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E7F4F0] text-[#0B6B5D]">
            <Map className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">
              Society block maps
            </h3>
            <p className="mt-0.5 text-[12px] text-neutral-400">
              Upload the official layout map for each area — it shows on that
              area&rsquo;s guide page. JPG · PNG · WebP · AVIF, up to 4 MB.
            </p>
          </div>
        </div>

        {loadError && (
          <p className="mt-3 rounded-2xl border border-[#E5484D]/25 bg-[#E5484D]/[0.06] px-4 py-3 text-[13px] text-[#D5303B]">
            {loadError}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {AREA_SLOTS.map((slot) => {
            const path = paths?.[slot.key] || "";
            const busy = busyKey === slot.key;
            return (
              <div
                key={slot.key}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.07] bg-white p-3"
              >
                <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-[#F7F9F8]">
                  {path ? (
                    <Image
                      src={path}
                      alt={`${slot.name} block map`}
                      fill
                      sizes="96px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-300">
                      <Map className="h-5 w-5" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-neutral-900">
                    {slot.name}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-neutral-400">
                    {path
                      ? "Official map is live on the area page"
                      : "No map yet — visitors see the live location map"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-[12.5px] font-semibold ${BRAND_OUTLINE} ${
                      busy ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {path ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadFor(slot, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {path && (
                    <Button
                      onClick={() => void removeFor(slot)}
                      disabled={busy}
                      size="sm"
                      variant="ghost"
                      className="h-9 rounded-xl px-3 text-[12.5px] font-semibold text-[#D5303B] hover:bg-[#E5484D]/[0.08] hover:text-[#D5303B]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </motion.section>
  );
}

/* ----------------------------- Password card ------------------------------ */

function PasswordCard({ api }: { api: AdminApi }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      toast.success("Password changed — use it on your next sign-in");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      if (!isAuthLoss(err)) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    autoComplete: string
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] text-neutral-500">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="h-10 rounded-xl border-black/[0.09] pr-10 text-[13.5px] focus-visible:ring-[#0F766E]/35"
          required
        />
        {id === "pw-current" && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide passwords" : "Show passwords"}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 hover:bg-black/[0.05]"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }}>
      <AdminCard>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E7F4F0] text-[#0B6B5D]">
            <KeyRound className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Change password</h3>
            <p className="mt-0.5 text-[12px] text-neutral-400">
              Minimum 8 characters. You stay signed in on this device.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-3">
          {field("pw-current", "Current password", current, setCurrent, "current-password")}
          {field("pw-new", "New password", next, setNext, "new-password")}
          {field("pw-confirm", "Confirm new password", confirm, setConfirm, "new-password")}

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#E5484D]/[0.08] px-3.5 py-2.5 text-[12.5px] font-medium text-[#D5303B] sm:col-span-3"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end sm:col-span-3">
            <Button
              type="submit"
              disabled={busy || !current || !next || !confirm}
              className={`h-10 rounded-xl px-5 text-[13px] font-semibold ${BRAND_BTN}`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </Button>
          </div>
        </form>
      </AdminCard>
    </motion.section>
  );
}
