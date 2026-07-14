import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  email: string | null;
}

export function ChangePasswordDialog({ email }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email) {
      toast.error("Kullanıcı bulunamadı");
      return;
    }
    if (!next) {
      toast.error("Yeni şifre gerekli");
      return;
    }
    if (next !== confirm) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (next === current) {
      toast.error("Yeni şifre eskisiyle aynı olamaz");
      return;
    }
    setBusy(true);
    try {
      // Mevcut şifreyi doğrula (başarılı signIn oturumu tazeler, bozmaz)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signInErr) {
        toast.error("Mevcut şifre hatalı");
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Şifreniz güncellendi.");
      reset();
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent transition"
        >
          <KeyRound size={14} /> Şifremi Değiştir
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Şifreyi Değiştir</DialogTitle>
          <DialogDescription>
            Güvenliğiniz için önce mevcut şifrenizi girin, ardından yeni şifreyi
            belirleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Mevcut şifre</label>
            <input
              type="password"
              required
              minLength={6}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Yeni şifre</label>
            <input
              type="password"
              required
              minLength={6}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Yeni şifre (tekrar)</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
