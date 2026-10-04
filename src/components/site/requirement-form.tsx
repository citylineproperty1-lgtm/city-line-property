"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type LeadInput } from "@/lib/types";
import { AREAS, waLink } from "@/lib/business";
import { cn } from "@/lib/utils";
import { Loader2, Send, CheckCircle2, MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const BUDGETS: { value: string; label: string }[] = [
  { value: "0", label: "Any budget" },
  { value: "2500000", label: "25 Lakh" },
  { value: "5000000", label: "50 Lakh" },
  { value: "7500000", label: "75 Lakh" },
  { value: "10000000", label: "1 Crore" },
  { value: "15000000", label: "1.5 Crore" },
  { value: "20000000", label: "2 Crore" },
  { value: "30000000", label: "3 Crore" },
  { value: "50000000", label: "5 Crore" },
  { value: "100000000", label: "10 Crore" },
];

/* Monthly rent scale — shown when purpose is Rent (the buy scale above
   doesn't make sense for monthly rentals). */
const RENT_BUDGETS: { value: string; label: string }[] = [
  { value: "0", label: "Any rent" },
  { value: "15000", label: "15,000 / mo" },
  { value: "25000", label: "25,000 / mo" },
  { value: "50000", label: "50,000 / mo" },
  { value: "75000", label: "75,000 / mo" },
  { value: "100000", label: "1 Lakh / mo" },
  { value: "150000", label: "1.5 Lakh / mo" },
  { value: "250000", label: "2.5 Lakh / mo" },
];

type RequirementPurpose = "BUY" | "RENT";

const PURPOSE_OPTIONS: { value: RequirementPurpose; label: string }[] = [
  { value: "BUY", label: "Buy" },
  { value: "RENT", label: "Rent" },
];

const PHONE_RE = /^(\+?\d[\d\s-]{7,15})$/;

/**
 * "Post your requirement" lead form.
 * Saves a CRM lead via POST /api/leads (source: REQUIREMENT) and offers a
 * one-tap wa.me deep link (returned by the API) so the visitor can send the
 * exact same brief to the office WhatsApp from their own chat.
 * Also rendered on the Contact page.
 */
export function RequirementForm({ source = "REQUIREMENT" }: { source?: LeadInput["source"] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("ALL");
  const [purpose, setPurpose] = useState<RequirementPurpose>("BUY");
  const [area, setArea] = useState("ALL");
  const [budget, setBudget] = useState("0");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waLinkOut, setWaLinkOut] = useState<string | null>(null);

  /* Rent vs buy budgets live on different scales — reset the budget when the
     picked value doesn't exist on the newly selected scale. */
  const budgets = purpose === "RENT" ? RENT_BUDGETS : BUDGETS;
  const switchPurpose = (next: RequirementPurpose) => {
    setPurpose(next);
    const list = next === "RENT" ? RENT_BUDGETS : BUDGETS;
    if (!list.some((b) => b.value === budget)) setBudget("0");
  };

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setCategory("ALL");
    setPurpose("BUY");
    setArea("ALL");
    setBudget("0");
    setMessage("");
    setError(null);
    setWaLinkOut(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!PHONE_RE.test(phone.trim())) {
      setError("Please enter a valid phone number (e.g. 0300 1234567).");
      return;
    }

    const budgetNum = Number(budget);
    const purposeWord = purpose === "BUY" ? "buy" : "rent";
    const budgetLabel = budgets.find((b) => b.value === budget)?.label;
    const brief =
      message.trim() ||
      `I'm looking to ${purposeWord} ${category === "ALL" ? "property" : CATEGORIES.find((c) => c.slug === category)?.name.toLowerCase() ?? category}` +
        `${area !== "ALL" ? ` in ${area}` : ""}` +
        `${budgetNum > 0 ? (purpose === "RENT" ? `, rent up to ${budgetLabel}` : `, budget around ${budgetLabel}`) : ""}. Please call me back.`;

    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          category: category !== "ALL" ? category : undefined,
          area: area !== "ALL" ? area : undefined,
          budget: budgetNum > 0 ? budgetNum : undefined,
          message: brief,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save your requirement. Please try again.");
        return;
      }
      setWaLinkOut(data.waLink ?? waLink(brief));
      toast.success("Requirement saved — our team will call you", {
        description: "Prefer chatting? Send the same brief on WhatsApp in one tap.",
      });
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (waLinkOut) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col items-center rounded-2xl border border-primary/20 bg-gradient-to-b from-accent/70 to-card px-6 py-12 text-center"
        role="status"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </span>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          Requirement saved — our team will call you
        </h3>
        <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
          Thanks {name.split(" ")[0] || "there"}! Your brief is with the City Line team.
          Expect a call within working hours (Mon–Sun, 10 AM – 8 PM).
        </p>
        <Button
          onClick={() => window.open(waLinkOut, "_blank", "noopener")}
          className="mt-6 h-12 w-full rounded-full bg-[#22C55E] text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,197,94,0.6)] transition-colors hover:bg-[#16A34A] sm:w-auto sm:px-8"
        >
          <MessageCircle className="mr-2 h-4.5 w-4.5" />
          Send on WhatsApp instead
        </Button>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Post another requirement
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rf-name" className="text-[13px] text-muted-foreground">
            Full name *
          </Label>
          <Input
            id="rf-name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ali Hassan"
            className="h-11 rounded-xl border-border bg-muted text-sm focus-visible:ring-ring/40"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rf-phone" className="text-[13px] text-muted-foreground">
            Phone (WhatsApp) *
          </Label>
          <Input
            id="rf-phone"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03xx xxx xxxx"
            className="h-11 rounded-xl border-border bg-muted text-sm focus-visible:ring-ring/40"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rf-email" className="text-[13px] text-muted-foreground">
          Email <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="rf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 rounded-xl border-border bg-muted text-sm focus-visible:ring-ring/40"
          autoComplete="email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[13px] text-muted-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 w-full rounded-xl border-border bg-muted text-sm focus:ring-0" aria-label="Category">
              <SelectValue placeholder="What are you looking for?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any category</SelectItem>
              {CATEGORIES.filter((c) => c.slug !== "for-rent").map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] text-muted-foreground">Area</Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="h-11 w-full rounded-xl border-border bg-muted text-sm focus:ring-0" aria-label="Preferred area">
              <SelectValue placeholder="Preferred area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any area</SelectItem>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px] text-muted-foreground">Purpose</Label>
        <div
          className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
          role="group"
          aria-label="Purpose — buy or rent"
        >
          {PURPOSE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => switchPurpose(t.value)}
              className={cn(
                "h-9 rounded-lg text-[13px] font-medium transition-all",
                purpose === t.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={purpose === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px] text-muted-foreground">Budget</Label>
        <Select value={budget} onValueChange={setBudget}>
          <SelectTrigger
            className="h-11 w-full rounded-xl border-border bg-muted text-sm focus:ring-0"
            aria-label={purpose === "RENT" ? "Monthly rent budget" : "Budget"}
          >
            <SelectValue placeholder="Your budget" />
          </SelectTrigger>
          <SelectContent>
            {budgets.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rf-msg" className="text-[13px] text-muted-foreground">
          Message <span className="text-muted-foreground">(optional — we build a brief for you)</span>
        </Label>
        <Textarea
          id="rf-msg"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. 5 Marla plot near the main boulevard, ideally corner…"
          className="resize-none rounded-xl border-border bg-muted text-sm focus-visible:ring-ring/40"
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          {error}
        </motion.p>
      )}

      <Button
        type="submit"
        disabled={sending}
        className="h-12 w-full rounded-full brand-gradient text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(15,118,110,0.65)] hover:opacity-95"
      >
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Post requirement — we call you back
          </>
        )}
      </Button>
      <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
        Free &amp; non-binding. Your details are only used to call you back about this
        requirement — never shared, never spammed.
      </p>
    </form>
  );
}
