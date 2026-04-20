import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Users, Printer, TrendingUp } from "lucide-react";

/** Palette 84 — CareTip brand accents */
const P = {
  teal: "#197278",
  deep: "#384D48",
  sage: "#ACAD94",
  gray: "#6E7271",
  tomato: "#C44536",
} as const;

interface CareTipUsageGuidelinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CareTipUsageGuidelinesDialog({
  open,
  onOpenChange,
}: CareTipUsageGuidelinesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto border-2" style={{ borderColor: P.teal }}>
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ color: P.deep }}>
            CareTip Usage Guidelines
          </DialogTitle>
          <DialogDescription className="text-left" style={{ color: P.gray }}>
            Practical steps to get your team set up and grow tips. This is a quick reference, save or print for your
            staff room.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-2 text-sm text-foreground">
          <section
            className="rounded-xl border-l-4 p-4"
            style={{ borderLeftColor: P.teal, backgroundColor: `${P.sage}18` }}
          >
            <h3 className="flex items-center gap-2 font-semibold text-base mb-2" style={{ color: P.deep }}>
              <Users className="h-5 w-5 shrink-0" style={{ color: P.teal }} />
              Onboard your staff
            </h3>
            <ul className="list-disc pl-5 space-y-2" style={{ color: P.gray }}>
              <li>
                Invite team members from <strong style={{ color: P.deep }}>Manage Staff</strong> using your business
                invite code or add them directly with name and role.
              </li>
              <li>
                Ask each staff member to complete their profile and confirm they can sign in to the employee dashboard.
              </li>
              <li>
                Deactivate former staff promptly so tips and QR codes stay accurate.
              </li>
            </ul>
          </section>

          <section
            className="rounded-xl border-l-4 p-4"
            style={{ borderLeftColor: P.tomato, backgroundColor: `${P.teal}10` }}
          >
            <h3 className="flex items-center gap-2 font-semibold text-base mb-2" style={{ color: P.deep }}>
              <Printer className="h-5 w-5 shrink-0" style={{ color: P.tomato }} />
              Print QR tags
            </h3>
            <ul className="list-disc pl-5 space-y-2" style={{ color: P.gray }}>
              <li>
                Open <strong style={{ color: P.deep }}>Generate QR Codes</strong> and download each staff member&apos;s
                branded QR.
              </li>
              <li>
                Print on durable cards or tent cards; place them where guests naturally look (reception, tables, checkout).
              </li>
              <li>
                Re-print when names or roles change so scans always match the right person.
              </li>
            </ul>
          </section>

          <section
            className="rounded-xl border-l-4 p-4"
            style={{ borderLeftColor: P.sage, backgroundColor: `${P.tomato}0D` }}
          >
            <h3 className="flex items-center gap-2 font-semibold text-base mb-2" style={{ color: P.deep }}>
              <TrendingUp className="h-5 w-5 shrink-0" style={{ color: P.teal }} />
              Best practices for increasing tips
            </h3>
            <ul className="list-disc pl-5 space-y-2" style={{ color: P.gray }}>
              <li>
                Train staff to mention CareTip at key moments: end of service, checkout, or when guests thank them.
              </li>
              <li>
                Keep QR codes visible and unobstructed; a quick &quot;scan to tip&quot; sign boosts completion rates.
              </li>
              <li>
                Review your dashboard regularly, recognize top performers, and share feedback with the team.
              </li>
            </ul>
          </section>

          <p className="text-xs text-center pt-2" style={{ color: P.gray }}>
            A full PDF guideline may be added later; for now this page is your in-app reference.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
