import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Building2,
  Users,
  CheckCircle2,
  Loader2,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";
import type { DistrictSchool, DistrictPlanInfo, SchoolAllocation } from "./api";

interface InviteSchoolModalProps {
  schools: DistrictSchool[];
  seatsPurchased: number;
  seatsAllocated: number;
  allocations: SchoolAllocation[];
  onClose: () => void;
  onSuccess: () => void;
}

function InviteSchoolModal({
  schools,
  seatsPurchased,
  seatsAllocated,
  allocations,
  onClose,
  onSuccess,
}: InviteSchoolModalProps) {
  const { toast } = useToast();
  const { request } = useApi();

  const allocationMap = Object.fromEntries(
    allocations.map((a) => [a.schoolId, a.seatsAllocated]),
  );

  const [seats, setSeats] = useState<Record<string, number>>(
    Object.fromEntries(schools.map((s) => [s.id, allocationMap[s.id] ?? 0])),
  );
  const [saving, setSaving] = useState(false);

  const totalAfterEdit = schools.reduce((sum, s) => sum + (seats[s.id] ?? 0), 0);
  const seatsRemaining = seatsPurchased - totalAfterEdit;
  const overLimit = seatsRemaining < 0;

  async function handleSave() {
    if (overLimit) return;
    setSaving(true);
    try {
      const changed = schools.filter(
        (s) => (seats[s.id] ?? 0) !== (allocationMap[s.id] ?? 0),
      );
      await Promise.all(
        changed.map((s) =>
          request(`/api/district/schools/${s.id}/allocate`, {
            method: "PUT",
            body: JSON.stringify({ seatsAllocated: seats[s.id] ?? 0 }),
          }),
        ),
      );
      toast({ title: "Seat allocations saved!" });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save allocations";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-black text-foreground">Invite Schools</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assign seats to schools in your district
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seat counter bar */}
        <div
          className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold shrink-0 ${
            overLimit
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/8 text-foreground"
          }`}
        >
          <AlertCircle
            className={`w-4 h-4 shrink-0 ${overLimit ? "text-destructive" : "text-primary"}`}
          />
          <span>
            {totalAfterEdit} / {seatsPurchased} seats assigned
            {overLimit
              ? ` — exceeds limit by ${-seatsRemaining}`
              : seatsRemaining === 0
                ? " — all seats assigned"
                : ` — ${seatsRemaining} remaining`}
          </span>
        </div>

        {/* School list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {schools.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Building2 className="w-7 h-7" />
              <p className="text-sm">No schools in this district yet.</p>
            </div>
          ) : (
            schools.map((school) => (
              <div
                key={school.id}
                className="flex items-center gap-3 px-4 py-3 bg-muted/30 rounded-xl border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] text-xs font-black shrink-0">
                  {school.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{school.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {school.studentCount} student{school.studentCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 text-foreground font-black text-sm flex items-center justify-center transition-colors"
                    onClick={() =>
                      setSeats((prev) => ({
                        ...prev,
                        [school.id]: Math.max(0, (prev[school.id] ?? 0) - 1),
                      }))
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={seatsPurchased}
                    value={seats[school.id] ?? 0}
                    onChange={(e) =>
                      setSeats((prev) => ({
                        ...prev,
                        [school.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-14 text-center text-sm font-black bg-card border border-border/40 rounded-xl px-2 py-1.5 text-foreground shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <button
                    className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 text-foreground font-black text-sm flex items-center justify-center transition-colors"
                    onClick={() =>
                      setSeats((prev) => ({
                        ...prev,
                        [school.id]: (prev[school.id] ?? 0) + 1,
                      }))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="font-bold border-border rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || overLimit || schools.length === 0}
            className="btn-brand font-bold rounded-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save allocations"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface DistrictPlanCardProps {
  plan: DistrictPlanInfo;
  allocations: SchoolAllocation[];
  schools: DistrictSchool[];
  onRefresh: () => void;
}

export function DistrictPlanCard({
  plan,
  allocations,
  schools,
  onRefresh,
}: DistrictPlanCardProps) {
  const [showModal, setShowModal] = useState(false);

  if (!plan.hasActivePlan) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">No active plan</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Purchase an Organization plan to allocate seats to your schools.
          </p>
        </div>
      </div>
    );
  }

  const pct = plan.seatsPurchased > 0
    ? Math.min(100, Math.round((plan.seatsAllocated / plan.seatsPurchased) * 100))
    : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/40 shadow-sm rounded-2xl overflow-hidden"
      >
        {/* Top bar */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-black text-foreground text-sm">Organization Plan</p>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-growth-green/10 border border-growth-green/20 text-growth-green">
                Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan.seatsAllocated} of {plan.seatsPurchased} seats assigned to schools ·{" "}
              <span className={plan.seatsRemaining === 0 ? "text-energy-orange font-bold" : "text-growth-green font-bold"}>
                {plan.seatsRemaining} remaining
              </span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="btn-brand font-bold rounded-xl text-xs shrink-0"
          >
            <Building2 className="w-3.5 h-3.5 mr-1.5" />
            Invite School
          </Button>
        </div>

        {/* Seat breakdown */}
        <div className="px-5 pb-4 space-y-3">
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>

          {/* 3-stat row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Purchased", value: plan.seatsPurchased, icon: CreditCard },
              { label: "Assigned", value: plan.seatsAllocated, icon: Users },
              { label: "Remaining", value: plan.seatsRemaining, icon: Building2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card border border-border/40 shadow-sm rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="text-xl font-black text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Per-school allocation list */}
          {allocations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground px-1">
                School allocations
              </p>
              {allocations.map((a) => (
                <div
                  key={a.schoolId}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-xl"
                >
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-xs font-medium text-foreground truncate">
                    {a.schoolName}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {a.seatsAllocated} seat{a.seatsAllocated !== 1 ? "s" : ""}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <InviteSchoolModal
            schools={schools}
            seatsPurchased={plan.seatsPurchased}
            seatsAllocated={plan.seatsAllocated}
            allocations={allocations}
            onClose={() => setShowModal(false)}
            onSuccess={onRefresh}
          />
        )}
      </AnimatePresence>
    </>
  );
}
