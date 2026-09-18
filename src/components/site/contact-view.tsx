"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const FAQS = [
  {
    q: "Do you charge for viewings?",
    a: "Never. Viewings are free and unlimited — we want you to be certain before you commit to anything.",
  },
  {
    q: "What commission do you take?",
    a: "Sales: 1% of the transaction value. Rentals: half a month's rent from each side. Commercial leasing is quoted per requirement. Everything is disclosed up front in writing.",
  },
  {
    q: "How do you verify listings?",
    a: "Every listing passes a 21-point check: physical inspection, ownership documents verified against society records, and photos taken by our own team — never supplied by owners.",
  },
  {
    q: "Can you help with legal transfer and paperwork?",
    a: "Yes. We coordinate society transfer processes, token and bayana documentation, and can recommend independent lawyers for title opinion.",
  },
  {
    q: "I'm overseas — can I buy remotely?",
    a: "Absolutely. We regularly complete purchases for overseas Pakistanis with video tours, digital documentation and power-of-attorney guidance.",
  },
];

export function ContactView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, kind, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSent(true);
      toast.success("Message sent — thank you!", {
        description: "A senior agent will reply within a few working hours.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">
          Contact
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
          Let&rsquo;s talk property.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
          Buying, selling, renting or just curious what your home is worth — drop us
          a line and a senior agent (never a call centre) will get back to you.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Form */}
        <motion.div
          {...fadeUp}
          className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8"
        >
          {sent ? (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-900">
                Message received
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
                Thanks {name.split(" ")[0]} — your {kind === "VALUATION" ? "valuation request" : "message"} is
                with our team. Expect a reply at {email} within a few working hours.
              </p>
              <Button
                onClick={() => {
                  setSent(false);
                  setName("");
                  setEmail("");
                  setPhone("");
                  setMessage("");
                  setKind("GENERAL");
                }}
                variant="outline"
                className="mt-7 h-11 rounded-full border-neutral-200 text-sm"
              >
                Send another message
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Send us a message
              </h2>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-name" className="text-[13px] text-neutral-600">
                      Full name *
                    </Label>
                    <Input
                      id="c-name"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ali Hassan"
                      className="h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email" className="text-[13px] text-neutral-600">
                      Email *
                    </Label>
                    <Input
                      id="c-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-phone" className="text-[13px] text-neutral-600">
                      Phone
                    </Label>
                    <Input
                      id="c-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 3xx xxx xxxx"
                      className="h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] text-neutral-600">I&rsquo;m here to</Label>
                    <Select value={kind} onValueChange={setKind}>
                      <SelectTrigger className="h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">Ask a general question</SelectItem>
                        <SelectItem value="VIEWING">Book a viewing</SelectItem>
                        <SelectItem value="VALUATION">Get a free valuation</SelectItem>
                        <SelectItem value="SELL">List my property for sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-msg" className="text-[13px] text-neutral-600">
                    Message *
                  </Label>
                  <Textarea
                    id="c-msg"
                    required
                    minLength={5}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about what you're looking for, your budget, or the property you'd like to sell…"
                    className="resize-none rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-neutral-300"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="h-12 w-full rounded-full bg-neutral-900 text-sm font-semibold hover:bg-neutral-700 sm:w-auto sm:px-8"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send message
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>

        {/* Info cards */}
        <motion.div {...fadeUp} className="flex flex-col gap-4">
          {[
            {
              icon: MapPin,
              title: "Visit the office",
              lines: ["14-C Khayaban-e-Ittehad", "DHA Phase 6, Karachi"],
              action: { label: "Open in Maps", href: "https://maps.google.com/?q=DHA+Phase+6+Karachi" },
            },
            {
              icon: Phone,
              title: "Call or WhatsApp",
              lines: ["+92 300 111 2233", "+92 21 3584 2211"],
              action: { label: "Call now", href: "tel:+923001112233" },
            },
            {
              icon: Mail,
              title: "Email us",
              lines: ["hello@citylineproperty.pk", "listings@citylineproperty.pk"],
              action: { label: "Write an email", href: "mailto:hello@citylineproperty.pk" },
            },
            {
              icon: Clock,
              title: "Office hours",
              lines: ["Mon – Sat · 9:00 AM – 8:00 PM", "Sunday viewings by appointment"],
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                  <c.icon className="h-4.5 w-4.5" />
                </span>
                <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                  {c.title}
                </h3>
              </div>
              <div className="mt-3 space-y-1 pl-[52px] text-[13.5px] leading-relaxed text-neutral-500">
                {c.lines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
              {c.action && (
                <a
                  href={c.action.href}
                  target={c.action.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="mt-3 ml-[52px] inline-block text-[13px] font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                >
                  {c.action.label} →
                </a>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* FAQ */}
      <section className="pt-16">
        <motion.h2
          {...fadeUp}
          className="text-center text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl"
        >
          Frequently asked questions
        </motion.h2>
        <motion.div {...fadeUp} className="mx-auto mt-8 max-w-2xl">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-neutral-200/80 bg-white px-5 shadow-none last:border-b"
              >
                <AccordionTrigger className="py-4 text-left text-[14.5px] font-medium text-neutral-800 hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[13.5px] leading-relaxed text-neutral-500">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>
    </div>
  );
}
