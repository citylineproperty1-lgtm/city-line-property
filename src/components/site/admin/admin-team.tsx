"use client";

/**
 * Team tab — manage the agents shown on the public site (about view, listing
 * cards, agent profiles). Deletion is blocked by the API (409) while listings
 * are still assigned; the error is surfaced as a toast.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Pencil, Phone, Plus, Trash2, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminApi,
  AdminCard,
  GOLD_BTN,
  GOLD_OUTLINE,
  errorMessage,
  fadeUp,
  isAuthLoss,
} from "./admin-shared";

interface AdminAgent {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  accent: string;
  bio: string;
  listings: number;
}

interface AgentForm {
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  accent: string;
  bio: string;
}

const EMPTY_FORM: AgentForm = {
  name: "",
  title: "Property Consultant",
  email: "",
  phone: "",
  initials: "",
  accent: "#C9A227",
  bio: "",
};

const ACCENTS = ["#C9A227", "#34C759", "#30B0C7", "#AF52DE", "#FF9500", "#FF2D55", "#007AFF", "#A2845E"];

export function AdminTeam({ api }: { api: AdminApi }) {
  const [state, setState] = useState<{ key: string; agents: AdminAgent[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAgent | null>(null);
  const [form, setForm] = useState<AgentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAgent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const key = `team-${reload}`;

  useEffect(() => {
    let alive = true;
    api<{ agents: AdminAgent[] }>("/api/admin/agents")
      .then((d) => {
        if (alive) setState({ key, agents: d.agents });
      })
      .catch((err) => {
        if (!alive || isAuthLoss(err)) return;
        setLoadError(errorMessage(err));
        setState({ key, agents: [] });
      });
    return () => {
      alive = false;
    };
  }, [key, api]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: AdminAgent) => {
    setEditing(a);
    setForm({
      name: a.name,
      title: a.title,
      email: a.email,
      phone: a.phone,
      initials: a.initials,
      accent: a.accent,
      bio: a.bio,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/agents/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
        toast.success("Team member updated");
      } else {
        await api("/api/admin/agents", { method: "POST", body: JSON.stringify(form) });
        toast.success("Team member added");
      }
      setDialogOpen(false);
      setReload((r) => r + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/agents/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
      setReload((r) => r + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const agents = state?.agents ?? [];
  const loaded = state?.key === key;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <motion.div {...fadeUp}>
        <AdminCard className="p-4 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-neutral-900">
                <Users className="h-4 w-4 text-[#C9A227]" />
                Team
              </h2>
              <p className="mt-0.5 text-[12.5px] text-neutral-500">
                {loaded
                  ? `${agents.length} member(s) · shown on About, listing cards and agent profiles`
                  : "Loading team…"}
              </p>
            </div>
            <Button onClick={openAdd} className={`h-10 rounded-full px-4 text-[13px] font-semibold ${GOLD_BTN}`}>
              <Plus className="h-4 w-4" />
              Add member
            </Button>
          </div>
          {loadError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600">
              {loadError}
            </p>
          )}
        </AdminCard>
      </motion.div>

      {/* Member cards */}
      {!loaded ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-3xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <AdminCard className="p-10 text-center">
          <UserRound className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-[14.5px] font-semibold text-neutral-900">No team members yet</p>
          <p className="mt-1 text-[13px] text-neutral-500">
            Add your first member — they appear instantly on the public site.
          </p>
        </AdminCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
            >
              <AdminCard className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3.5">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white ring-4 ring-white"
                    style={{ backgroundColor: a.accent, boxShadow: `0 0 0 1px ${a.accent}55` }}
                  >
                    {a.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-neutral-900">
                      {a.name}
                    </p>
                    <p className="truncate text-[12.5px] font-medium text-[#8A7119]">{a.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-neutral-500">
                      <span className="truncate">{a.email}</span>
                      {a.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {a.phone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {a.bio && (
                  <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-neutral-500">{a.bio}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="rounded-full bg-[#C9A227]/12 px-2.5 py-1 text-[11px] font-bold text-[#8A7119]">
                    {a.listings} listing{a.listings === 1 ? "" : "s"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(a)}
                      className={`h-8 rounded-full px-3 text-[12px] font-semibold ${GOLD_OUTLINE}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTarget(a)}
                      className="h-8 rounded-full border-red-200 px-2.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${a.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold tracking-tight">
              {editing ? `Edit ${editing.name}` : "Add team member"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Profile changes appear immediately on the public site.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-1">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="agent-name" className="text-[12px] font-semibold text-neutral-600">Name *</Label>
                <Input
                  id="agent-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Hamza Tariq"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="agent-title" className="text-[12px] font-semibold text-neutral-600">Title</Label>
                <Input
                  id="agent-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Founder & Principal Agent"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="agent-email" className="text-[12px] font-semibold text-neutral-600">Email *</Label>
                <Input
                  id="agent-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@citylineproperty.com"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="agent-phone" className="text-[12px] font-semibold text-neutral-600">Phone</Label>
                <Input
                  id="agent-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0309 4499940"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-[120px_1fr]">
              <div className="grid gap-1.5">
                <Label htmlFor="agent-initials" className="text-[12px] font-semibold text-neutral-600">Initials</Label>
                <Input
                  id="agent-initials"
                  value={form.initials}
                  onChange={(e) => setForm((f) => ({ ...f, initials: e.target.value }))}
                  placeholder="HT"
                  maxLength={2}
                  className="h-10 rounded-xl uppercase"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[12px] font-semibold text-neutral-600">Avatar color</Label>
                <div className="flex h-10 items-center gap-1.5">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accent: c }))}
                      aria-label={`Accent ${c}`}
                      aria-pressed={form.accent === c}
                      className={`h-6 w-6 rounded-full transition-transform ${form.accent === c ? "scale-110 ring-2 ring-neutral-900 ring-offset-2" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="agent-bio" className="text-[12px] font-semibold text-neutral-600">Bio</Label>
              <Textarea
                id="agent-bio"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Short introduction shown on the agent profile…"
                className="min-h-[84px] rounded-xl"
              />
            </div>
            {/* live preview */}
            <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-[#FAF8F2] p-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ backgroundColor: form.accent }}
              >
                {(form.initials || form.name.split(" ").map((p) => p[0]).slice(0, 2).join("") || "CL").toUpperCase().slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-neutral-900">{form.name || "Preview name"}</p>
                <p className="truncate text-[11.5px] text-[#8A7119]">{form.title || "Title"}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-full px-4">
              Cancel
            </Button>
            <Button
              onClick={() => void save()}
              disabled={saving || form.name.trim().length < 2 || form.email.trim().length < 5}
              className={`h-10 rounded-full px-5 text-[13px] font-semibold ${GOLD_BTN}`}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px]">Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              This removes their public profile. Members with assigned listings cannot be deleted —
              reassign those listings first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void doDelete();
              }}
              disabled={deleting}
              className="h-10 rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              {deleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
