"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RequirementForm } from "@/components/site/requirement-form";
import { BUSINESS, AREAS, waLink } from "@/lib/business";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Navigation,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const FAQS = [
  {
    q: "What commission do you charge?",
    a: "A flat 1% of the transaction value — confirmed in writing before we start. No hidden margin, no 'service charges', no middlemen taking a cut. Rentals are charged at an agreed flat rate, also disclosed up front.",
  },
  {
    q: "Which areas do you cover?",
    a: `Only five, so we know every file personally: ${AREAS.join(", ")}. If you're buying elsewhere, we'll honestly tell you to find a local specialist — we don't deal where we can't vouch for the property.`,
  },
  {
    q: "What does 'direct dealing' actually mean?",
    a: "You meet the owner and negotiate face to face — we facilitate, verify documents and handle paperwork. We never buy cheap to sell dear, never take a margin on top, and the price on the file is always the owner's price.",
  },
  {
    q: "How do you verify listings?",
    a: "Every file is physically inspected and ownership documents are checked against society records before it goes live. Photos are taken by our own team — never supplied by owners.",
  },
  {
    q: "I'm overseas — can I buy or rent remotely?",
    a: "Yes. We regularly complete deals for overseas Pakistanis with video tours, digital documentation and power-of-attorney guidance. Start by posting your requirement here or on WhatsApp.",
  },
];

export function ContactView() {
  return (
    <div className="mx-auto max-w-6xl bg-background px-4 py-10 sm:px-6 sm:py-14">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">
          Contact
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
          Let&rsquo;s talk property.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
          Buying, selling, renting or just want to know what your file is worth — post
          your requirement and a real person from the City Line office (never a call
          centre) will call you back.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Requirement form → saved as a CRM lead */}
        <motion.div
          {...fadeUp}
          className="rounded-3xl border border-black/[0.07] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,118,110,0.35)] sm:p-8"
        >
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Post your requirement — we call you back
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">
            Free and non-binding. On the next screen you can also send the same brief
            straight to our WhatsApp.
          </p>
          <div className="mt-6">
            <RequirementForm source="CONTACT" />
          </div>
        </motion.div>

        {/* Info cards — real office details */}
        <motion.div {...fadeUp} className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#0F766E]/20 bg-[#E7F4F0]/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_6px_16px_-6px_rgba(15,118,110,0.6)]">
                <MapPin className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Visit the office
              </h3>
            </div>
            <p className="mt-3 pl-[52px] text-[13.5px] leading-relaxed text-neutral-500">
              {BUSINESS.officeAddress}
            </p>
            <div className="mt-3 ml-[52px] flex flex-wrap gap-3">
              <a
                href="https://maps.google.com/?q=Etihad+Town+Phase+1+Lahore"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0B6B5D] transition-colors hover:text-[#0F766E]"
              >
                <Navigation className="h-3.5 w-3.5" />
                Open in Maps →
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <Phone className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Call or WhatsApp
              </h3>
            </div>
            <div className="mt-3 space-y-1 pl-[52px] text-[13.5px] leading-relaxed text-neutral-500">
              <p>
                <a href={`tel:${BUSINESS.telPrimary}`} className="font-medium text-neutral-700 hover:text-[#0B6B5D]">
                  {BUSINESS.phonePrimary}
                </a>{" "}
                (WhatsApp)
              </p>
              <p>
                <a href={`tel:${BUSINESS.telSecondary}`} className="font-medium text-neutral-700 hover:text-[#0B6B5D]">
                  {BUSINESS.phoneSecondary}
                </a>
              </p>
            </div>
            <a
              href={waLink("Hi City Line Property — I have a question about property in Etihad Town.")}
              target="_blank"
              rel="noreferrer"
              className="mt-3 ml-[52px] inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#15803D] transition-colors hover:text-[#16A34A]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat on WhatsApp →
            </a>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Email us
              </h3>
            </div>
            <p className="mt-3 pl-[52px] text-[13.5px] leading-relaxed text-neutral-500">
              <a href={`mailto:${BUSINESS.email}`} className="break-all font-medium text-neutral-700 hover:text-[#0B6B5D]">
                {BUSINESS.email}
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <Clock className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Office hours
              </h3>
            </div>
            <p className="mt-3 pl-[52px] text-[13.5px] leading-relaxed text-neutral-500">
              {BUSINESS.hours}
              <br />
              <span className="text-neutral-400">Sunday — viewings by appointment</span>
            </p>
          </div>
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
                className="rounded-2xl border border-black/[0.07] bg-white px-5 shadow-none last:border-b"
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

      {/* Bottom CTA */}
      <motion.div {...fadeUp} className="mt-14 flex flex-col items-center text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0B6B5D]">
          Prefer to talk first?
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="brand-gradient h-12 rounded-full px-7 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(15,118,110,0.65)] hover:opacity-95">
            <a href={`tel:${BUSINESS.telPrimary}`}>
              <Phone className="mr-2 h-4 w-4" />
              Call {BUSINESS.phonePrimary}
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-[#22C55E]/40 bg-white px-7 text-sm font-semibold text-[#15803D] hover:bg-[#22C55E]/10"
          >
            <a
              href={waLink("Hi City Line Property — I'd like to discuss a property requirement.")}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp {BUSINESS.phoneSecondary}
            </a>
          </Button>
        </div>
        <p className="mt-4 text-[12.5px] text-neutral-400">
          {BUSINESS.hours} · {BUSINESS.officeAddress}
        </p>
      </motion.div>
    </div>
  );
}
