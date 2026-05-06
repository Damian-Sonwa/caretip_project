import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, Upload, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import {
  getEmployeeProfile,
  patchEmployeeProfile,
  uploadEmployeeAvatar,
  changePasswordAPI,
  downloadMyDataExport,
  deleteMyEmployeeAccount,
} from "../../lib/api";
import {
  getPasswordChecklist,
  isPasswordStrong,
  getPasswordStrength,
} from "../../lib/passwordValidation";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";

const TEAL = "#EB992C";

export function EmployeeSettingsPage() {
  const { user, logout, updateUser } = useRequireAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "employee") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await getEmployeeProfile();
        if (cancelled) return;
        setName(p.name);
        setBio(p.bio ?? "");
        setMonthlyGoal(p.monthlyGoal != null ? String(p.monthlyGoal) : "");
        setEmailNotif(p.emailNotifications);
        setPushNotif(p.pushNotifications);
        updateUser({ avatar: p.avatar ?? undefined, name: p.name });
      } catch (err) {
        logClientError("EmployeeSettingsPage", err);
        toast.error("Could not load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- full `user` would loop after updateUser
  }, [user?.role, user?.id, updateUser]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const mg = monthlyGoal.trim() === "" ? null : Number(monthlyGoal);
      if (monthlyGoal.trim() !== "" && (Number.isNaN(mg) || mg! < 0)) {
        toast.error("Monthly goal must be a valid number.");
        setSaving(false);
        return;
      }
      const updated = await patchEmployeeProfile({
        name: name.trim(),
        bio: bio.trim() || null,
        monthlyGoal: mg,
        emailNotifications: emailNotif,
        pushNotifications: pushNotif,
      });
      updateUser({ name: updated.name, avatar: updated.avatar ?? undefined });
      toast.success("Profile saved.", { style: { background: TEAL, color: "#fff" } });
    } catch (e) {
      logClientError("EmployeeSettingsPage", e);
      toast.error(toUserFriendlyMessage(e, { audience: "employee" }));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const { avatar } = await uploadEmployeeAvatar(file);
      const base = avatar.split("?")[0];
      updateUser({ avatar: `${base}?v=${Date.now()}` });
      toast.success("Photo updated.", { style: { background: TEAL, color: "#fff" } });
    } catch (err) {
      logClientError("EmployeeSettingsPage", err);
      toast.error(toUserFriendlyMessage(err, { audience: "employee" }));
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isPasswordStrong(newPw)) {
      toast.error("New password does not meet all requirements.");
      return;
    }
    try {
      await changePasswordAPI(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      toast.success("Password updated.", { style: { background: TEAL, color: "#fff" } });
    } catch (err) {
      logClientError("EmployeeSettingsPage", err);
      toast.error(toUserFriendlyMessage(err, { audience: "employee" }));
    }
  };

  const handleDownload = async () => {
    try {
      await downloadMyDataExport();
      toast.success("Download started.");
    } catch (err) {
      logClientError("EmployeeSettingsPage", err);
      toast.error("Download failed.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteMyEmployeeAccount();
      logout();
      navigate("/", { replace: true });
      toast.success("Your account has been deleted.");
    } catch (err) {
      logClientError("EmployeeSettingsPage", err);
      toast.error("Could not delete account.");
    }
  };

  const checklist = getPasswordChecklist(newPw);
  const strength = getPasswordStrength(newPw);

  if (!user || user.role !== "employee") return null;

  if (loading) {
    return <CareTipPageLoader />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/employee/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        </div>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground" style={{ color: "#283D3B" }}>
            Profile photo
          </h3>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <ProfileAvatar
              key={user.avatar ?? "none"}
              src={user.avatar}
              displayName={user.name ?? "You"}
              className="h-24 w-24 border-2 border-border shadow-md sm:h-28 sm:w-28"
            />
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer disabled:opacity-50" style={{ backgroundColor: TEAL }}>
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatar} disabled={uploading} />
          </label>
          <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, or WebP. Max 5 MB.</p>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold" style={{ color: "#283D3B" }}>
            Profile
          </h3>
          <div>
            <Label htmlFor="emp-name">Name</Label>
            <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="emp-bio">Bio</Label>
            <textarea
              id="emp-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="emp-goal">Monthly goal</Label>
            <Input
              id="emp-goal"
              type="number"
              min={0}
              step="0.01"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              className="mt-1"
              placeholder="0.00"
            />
          </div>
          <Button type="button" onClick={handleSaveProfile} disabled={saving} className="text-white" style={{ backgroundColor: TEAL }}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold" style={{ color: "#283D3B" }}>
            Account security
          </h3>
          <div>
            <Label htmlFor="cur-pw">Current password</Label>
            <div className="relative mt-1">
              <Input
                id="cur-pw"
                type={showCur ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="pr-10"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1" onClick={() => setShowCur(!showCur)} aria-label="Toggle visibility">
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="new-pw">New password</Label>
            <div className="relative mt-1">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="pr-10"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1" onClick={() => setShowNew(!showNew)} aria-label="Toggle visibility">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${strength.score}%`,
                  backgroundColor: strength.strength === "strong" ? TEAL : strength.strength === "fair" ? "#fb923c" : "#ef4444",
                }}
              />
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {[
                { key: "minLength", label: "At least 8 characters", met: checklist.minLength },
                { key: "upper", label: "One uppercase letter", met: checklist.hasUppercase },
                { key: "lower", label: "One lowercase letter", met: checklist.hasLowercase },
                { key: "num", label: "One number", met: checklist.hasNumber },
                { key: "spec", label: "One special character", met: checklist.hasSpecial },
              ].map(({ key, label, met }) => (
                <li key={key} className={`flex items-center gap-2 ${met ? "text-primary" : ""}`}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full ${met ? "bg-primary text-white" : "bg-muted"}`}>
                    {met ? <Check className="w-2.5 h-2.5" /> : null}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <Button
            type="button"
            onClick={handleChangePassword}
            disabled={!currentPw || !newPw}
            variant="outline"
            className="border-2"
            style={{ borderColor: TEAL, color: TEAL }}
          >
            Change password
          </Button>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold" style={{ color: "#283D3B" }}>
            Preferences
          </h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-n">Email notifications</Label>
            <Switch id="email-n" checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-n">Push notifications</Label>
            <Switch id="push-n" checked={pushNotif} onCheckedChange={setPushNotif} />
          </div>
          <p className="text-xs text-muted-foreground">Use Save profile to apply preference changes.</p>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold" style={{ color: "#283D3B" }}>
            Your data
          </h3>
          <Button type="button" variant="outline" onClick={handleDownload} className="w-full sm:w-auto">
            Download My Data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="w-full sm:w-auto">
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes your Caretip staff account and associated data. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </div>
  );
}
