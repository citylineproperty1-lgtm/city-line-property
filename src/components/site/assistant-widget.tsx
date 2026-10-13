"use client";

/**
 * AssistantWidget — the CLP AI agent (voice + text).
 *
 * Floating button (bottom-left, mirrors the WhatsApp bubble on the right).
 * The panel is a small chat: visitors search listings and ask questions;
 * signed-in admins can also add/remove listings by command. Voice input is
 * recorded in-browser, transcribed server-side (/api/assistant/voice) and
 * then processed by the same agent endpoint (/api/assistant/chat).
 *
 * The server owns ALL safety: mutations only run with a valid admin session
 * cookie, and removals require a spoken-back confirmation token.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, RefreshCw, Send, Sparkles, Square, X } from "lucide-react";
import { formatPKR } from "@/lib/format";
import type { Property } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

// A voice-input problem, shown as a dismissible alert inside the chat.
type MicError = {
  text: string;
  hint?: string;
  action?: { label: string; onClick: () => void };
};

/** Friendly, fix-oriented message for a browser-blocked microphone. */
function blockedMicError(): MicError {
  if (typeof navigator === "undefined") {
    return { text: "Microphone is blocked for this site — please type instead." };
  }
  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
  return isIOS
    ? {
        text: "Microphone is blocked for this site.",
        hint:
          "To fix: open the Settings app → Safari (or your browser) → Microphone → Allow, then REFRESH this page. You can also just type below — the same assistant answers.",
      }
    : {
        text: "Microphone is blocked for this site.",
        hint:
          "To fix: tap the lock (🔒) icon next to the web address → Permissions → Microphone → Allow. On Windows also check Settings → Privacy → Microphone. Then REFRESH the page (F5). You can also just type below — the same assistant answers.",
      };
}

type MicPermissionState = "granted" | "prompt" | "denied" | "unsupported";

async function queryMicPermission(): Promise<MicPermissionState> {
  try {
    const perm = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return perm.state as MicPermissionState;
  } catch {
    return "unsupported"; // Firefox/Safari — no mic permission query
  }
}

/** Ask for the mic once. null = mic works; otherwise the DOMException name. */
async function probeMicHardware(): Promise<string | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return null;
  } catch (e) {
    return (e as DOMException | undefined)?.name ?? "UnknownError";
  }
}

/**
 * Find out WHY voice failed and give the exact fix.
 *
 * Known Chromium quirk: after the site permission is changed to Allow, the
 * speech engine can stay "stale denied" until the page is reloaded — the mic
 * really is allowed (getUserMedia succeeds) but SpeechRecognition keeps
 * saying not-allowed. In that case we offer a one-tap refresh.
 */
async function diagnoseMicFailure(): Promise<MicError> {
  const perm = await queryMicPermission();
  const gum = await probeMicHardware();
  if (gum === null) {
    // Hardware + browser permission are fine — only the speech engine failed.
    return {
      text: "Microphone is allowed — it just needs a page refresh to start.",
      hint: "Tap the button below, then tap the mic again.",
      action: { label: "Refresh page", onClick: () => window.location.reload() },
    };
  }
  if (perm === "denied" || gum === "NotAllowedError" || gum === "SecurityError") {
    return blockedMicError();
  }
  if (gum === "NotReadableError") {
    return { text: "The microphone is busy in another app — close it and try again." };
  }
  if (gum === "NotFoundError" || gum === "OverconstrainedError") {
    return { text: "No microphone found on this device — please type instead." };
  }
  return blockedMicError();
}

// ---- browser-native speech recognition (free, no server ASR needed) ----
// Chrome/Edge/Android ship it built-in; when absent we fall back to
// MediaRecorder + server-side transcription.
type ClpSRResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type ClpSRErrorEvent = { error?: string };
interface ClpSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: ClpSRResultEvent) => void) | null;
  onerror: ((e: ClpSRErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type ClpSRCtor = new () => ClpSpeechRecognition;

function getSpeechRecognition(): ClpSRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const SR = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as ClpSRCtor | undefined;
  return SR ?? null;
}

const WELCOME =
  "Hi! I'm the CLP Assistant 🤖 — ask me anything about our listings.\n\nTry:\n• \"3 marla plot in Etihad Phase 1\"\n• \"Houses under 2 crore\"\n• Tell me: CLP-117?";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: WELCOME }]);
  const [cards, setCards] = useState<Property[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mutated, setMutated] = useState(false);
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState<MicError | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recogRef = useRef<ClpSpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // keep the message list scrolled to the bottom
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, busy, cards, micError]);

  // detect admin session when the panel opens (server still enforces anyway)
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => {
        if (alive) setIsAdmin(r.ok);
      })
      .catch(() => {
        if (alive) setIsAdmin(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const send = useCallback(
    async (text: string, displayAs?: string) => {
      const message = text.trim();
      if (!message || busy) return;
      setMicError(null);
      setInput("");
      setMsgs((m) => [...m, { role: "user", content: displayAs ?? message }]);
      setBusy(true);
      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: msgs.filter((_, i) => i > 0).slice(-12), // skip welcome
          }),
        });
        const data = await res.json();
        if (data.reply) {
          setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
          if (Array.isArray(data.properties)) setCards(data.properties);
          if (data.action === "add_listing" || data.action === "remove_listing") {
            setMutated(true);
          }
        } else {
          setMsgs((m) => [
            ...m,
            { role: "assistant", content: data.error ?? "Something went wrong — try again." },
          ]);
        }
      } catch {
        setMsgs((m) => [
          ...m,
          { role: "assistant", content: "Connection problem — please try again." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, msgs]
  );

  // Keep a ref to `send` so voice handlers never fire with a stale closure.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // auto-dismiss voice error alerts so they never look like a broken UI
  useEffect(() => {
    if (!micError) return;
    const t = setTimeout(() => setMicError(null), 10_000);
    return () => clearTimeout(t);
  }, [micError]);

  // ---- voice input ----------------------------------------------------
  // 1st choice: browser speech recognition (works live, zero cost).
  // Fallback: record + server transcription (/api/assistant/voice).
  const startNativeSpeech = useCallback((): boolean => {
    const SR = getSpeechRecognition();
    if (!SR) return false;
    try {
      const rec = new SR();
      rec.lang = navigator.language?.startsWith("en") ? navigator.language : "en-US";
      rec.interimResults = false;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const transcript = e.results?.[0]?.[0]?.transcript ?? "";
        if (transcript.trim()) {
          void sendRef.current(transcript, `🎙️ "${transcript}"`);
        }
      };
      rec.onerror = (e) => {
        setRecording(false);
        const err = e.error;
        if (err === "aborted") return; // user pressed stop — stay quiet
        if (err === "not-allowed" || err === "service-not-allowed") {
          // Don't trust the label — probe the real mic state and tell the
          // user the exact fix (may just be a refresh after allowing).
          void diagnoseMicFailure().then(setMicError);
        } else if (err === "no-speech") {
          setMicError({
            text: "I didn't hear anything — tap the mic and speak a little louder.",
          });
        } else if (err === "audio-capture") {
          setMicError({ text: "No microphone found on this device — please type instead." });
        } else if (err === "network") {
          setMicError({
            text: "Voice service had a network problem — try again, or type your question.",
          });
        } else {
          setMicError({ text: "Did not catch that — tap the mic and try again." });
        }
      };
      rec.onend = () => setRecording(false);
      recogRef.current = rec;
      rec.start();
      setRecording(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setMicError(null);
    // Voice APIs need a secure context (https) — say so instead of failing oddly.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setMicError({
        text: "Voice input needs a secure connection — please type your question below.",
      });
      return;
    }
    // Pre-check permission where supported (Chrome/Edge/Android): if the site
    // setting is already "deny", diagnose and show the exact fix — no
    // recording flash.
    try {
      const perm = await navigator.permissions.query({ name: "microphone" as PermissionName });
      if (perm.state === "denied") {
        setMicError(await diagnoseMicFailure());
        return;
      }
    } catch {
      /* Firefox/Safari don't support mic permission queries — just continue */
    }
    if (startNativeSpeech()) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, {
            type: rec.mimeType || "audio/webm",
          });
          const fd = new FormData();
          fd.append("audio", blob, "command.webm");
          const vr = await fetch("/api/assistant/voice", { method: "POST", body: fd });
          const vd = await vr.json();
          if (vd.text) {
            // same pipeline as typed text — one user bubble, one reply
            void sendRef.current(vd.text, `🎙️ "${vd.text}"`);
          } else {
            setMicError({
              text: vd.error ?? "Could not hear you — try again, or type instead.",
            });
          }
        } catch {
          setMicError({ text: "Voice input failed — please type instead." });
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) {
      const name = (e as DOMException | undefined)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setMicError(blockedMicError());
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setMicError({ text: "No microphone found on this device — please type instead." });
      } else if (name === "NotReadableError") {
        setMicError({
          text: "The microphone is busy in another app — close it and try again.",
        });
      } else {
        setMicError({ text: "Microphone not available — please type instead." });
      }
    }
  }, [startNativeSpeech]);

  const stopRecording = useCallback(() => {
    if (recogRef.current) {
      try {
        recogRef.current.stop();
      } catch {
        /* already ended */
      }
      return;
    }
    recorderRef.current?.stop();
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating button — bottom-LEFT (WhatsApp bubble owns the right). */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.35 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close CLP Assistant" : "Open CLP Assistant — AI agent by voice or text"}
        aria-expanded={open}
        className="fixed bottom-4 left-4 z-[120] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-[0_10px_30px_-8px_rgba(15,118,110,0.65)] ring-1 ring-white/25 transition-transform hover:scale-105 active:scale-95 sm:bottom-5 sm:left-5 sm:h-14 sm:w-14"
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        {!open && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-emerald-400 ring-2 ring-white"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="assistant-panel"
            role="dialog"
            aria-label="CLP Assistant chat"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-[4.75rem] left-2 z-[120] flex h-[min(600px,72vh)] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)] sm:left-4 sm:w-[390px] md:bottom-6 md:left-6"
          >
            {/* header */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-teal-700 to-teal-900 px-4 py-3 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-4.5 w-4.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold leading-tight">CLP Assistant</div>
                <div className="truncate text-[11px] text-white/70">
                  AI agent — search, ask, and (admin) manage listings
                </div>
              </div>
              {isAdmin && (
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-300/40">
                  ADMIN TOOLS ON
                </span>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* messages */}
            <div
              ref={listRef}
              role="log"
              aria-live="polite"
              className="max-h-96 flex-1 space-y-3 overflow-y-auto bg-background px-3 py-3"
            >
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-teal-600 text-white"
                        : "rounded-bl-md bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {/* property mini-cards from the last search */}
              {cards.length > 0 && (
                <div className="space-y-2 pt-1">
                  {cards.slice(0, 4).map((p) => (
                    <a
                      key={p.id}
                      href={`#/property/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-2 transition-colors hover:border-teal-600/40 hover:bg-accent/50"
                    >
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-12 w-16 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-[10px] text-muted-foreground">
                          no photo
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-foreground">
                          {p.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="font-bold text-teal-700 dark:text-teal-400">
                            {formatPKR(p.price)}
                          </span>
                          <span>·</span>
                          <span>{p.reference}</span>
                          <span>·</span>
                          <span>{p.district}</span>
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {mutated && (
                <a
                  href="#/properties"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/10 px-3 py-1.5 text-[12px] font-semibold text-teal-700 ring-1 ring-teal-600/30 transition-colors hover:bg-teal-600/20 dark:text-teal-400"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> View updated listings
                </a>
              )}

              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600 [animation-delay:240ms]" />
                  </div>
                </div>
              )}

              {micError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-3 py-2.5 ring-1 ring-destructive/20"
                >
                  <MicOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
                  <div className="min-w-0 flex-1 text-[12px] leading-relaxed text-destructive">
                    <p className="font-semibold">{micError.text}</p>
                    {micError.hint && (
                      <p className="mt-0.5 text-destructive/80">{micError.hint}</p>
                    )}
                    {micError.action && (
                      <button
                        onClick={micError.action.onClick}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-destructive/85"
                      >
                        <RefreshCw className="h-3 w-3" aria-hidden />
                        {micError.action.label}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setMicError(null)}
                    aria-label="Dismiss voice message"
                    className="-mr-0.5 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-destructive/60 transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              )}
            </div>

            {/* input row */}
            <div className="border-t border-border bg-card px-3 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={busy}
                  aria-label={recording ? "Stop recording" : "Record a voice command"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                    recording
                      ? "animate-pulse bg-destructive text-white"
                      : "bg-teal-600/10 text-teal-700 hover:bg-teal-600/20 dark:text-teal-400"
                  } disabled:opacity-50`}
                >
                  {recording ? (
                    <Square className="h-4 w-4" aria-hidden />
                  ) : (
                    <Mic className="h-4.5 w-4.5" aria-hidden />
                  )}
                </button>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={recording ? "Listening… speak now" : "Ask or command… e.g. 3 marla plot"}
                  aria-label="Message the CLP Assistant"
                  className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-teal-600/50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={busy || !input.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white transition-all hover:bg-teal-700 active:scale-95 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-1.5 px-1 text-[10.5px] leading-snug text-muted-foreground">
                Voice or text — same agent. Listing changes need an Admin sign-in.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
