import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Download, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  renderBrandedQRToDataUrl,
  downloadBrandedQR,
  getEmployeeQrShareUrl,
} from "../../lib/qrBranded";
import { logClientError } from "../../lib/clientLog";
import { CareTipLoadingTitle } from "../CareTipPageLoader";
import { LoadingSpinner } from "../ui/loading-spinner";

type EmployeeQRCodeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stable id — encoded in QR as /qr/employee/:id */
  employeeId: string;
  employeeName: string;
};

export function EmployeeQRCodeModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: EmployeeQRCodeModalProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [imgLoading, setImgLoading] = useState(false);

  useEffect(() => {
    if (!open || !employeeId) return;
    let cancelled = false;
    setImgLoading(true);
    setDataUrl("");
    renderBrandedQRToDataUrl(employeeId)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((err) => {
        logClientError("EmployeeQRCodeModal", err);
      })
      .finally(() => {
        if (!cancelled) setImgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, employeeId]);

  const copyLink = async () => {
    const text = getEmployeeQrShareUrl(employeeId);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
    } catch (err) {
      logClientError("EmployeeQRCodeModal", err);
      toast.error("Could not copy link");
    }
  };

  const download = () => {
    void downloadBrandedQR(employeeId, employeeName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your tip QR code</DialogTitle>
          <DialogDescription>
            Guests scan this to open your public tipping page.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="min-h-[280px] flex items-center justify-center w-full bg-muted/30 rounded-xl border border-border p-4">
            {imgLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <CareTipLoadingTitle compact />
                <LoadingSpinner size="lg" />
              </div>
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt={`QR code for ${employeeName}`}
                className="max-w-full h-auto rounded-lg"
              />
            ) : null}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              type="button"
              onClick={download}
              disabled={imgLoading || !dataUrl}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0" />
              Download image
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              <LinkIcon className="w-4 h-4 shrink-0" />
              Copy link
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center break-all px-2">
            {getEmployeeQrShareUrl(employeeId)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
