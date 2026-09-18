"use client";

/**
 * Admin login — reached only by typing /#/admin. No public links point here.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_BTN, BRAND_TEXT } from "./admin-shared";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export function AdminLogin({ onSuccess }: { onSuccess: (admin: AdminUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        admin?: AdminUser;
        error?: string;
      };
      if (!res.ok || !data.admin) {
        setError(data.error ?? "Invalid email or password.");
        setBusy(false);
        return;
      }
      toast.success(`Welcome back, ${data.admin.name.split(" ")[0]}`);
      onSuccess(data.admin);
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-14">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-[0_10px_40px_rgba(0,0,0,0.07)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-sm">
              <Image src="/logo.png" alt="City Line Property logo" width={52} height={52} className="h-13 w-13 rounded-xl" />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-neutral-900">
              City Line Property
            </h1>
            <p className={`mt-1 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] ${BRAND_TEXT}`}>
              <LockKeyhole className="h-3.5 w-3.5" />
              Admin panel
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-[12.5px] text-neutral-600">
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="you@citylineproperty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-black/[0.09] bg-white text-[14px] focus-visible:ring-[#0F766E]/35"
                disabled={busy}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-[12.5px] text-neutral-600">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-black/[0.09] bg-white pr-11 text-[14px] focus-visible:ring-[#0F766E]/35"
                  disabled={busy}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-black/[0.05] hover:text-neutral-700"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-xl bg-[#E5484D]/[0.08] px-3.5 py-2.5 text-[12.5px] font-medium text-[#D5303B]"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className={`h-11 w-full rounded-xl text-[14px] font-semibold ${BRAND_BTN}`}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px] text-neutral-400">
          Authorized personnel only · All actions are logged
        </p>
      </motion.div>
    </div>
  );
}
