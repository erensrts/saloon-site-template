import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Şifre Sıfırla" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Supabase, e-postadaki linkle geldiğinde PASSWORD_RECOVERY event'ini
    // tetikler ve geçici bir oturum açar. Hem event'i dinliyoruz hem de
    // mount anında mevcut oturumu kontrol ediyoruz.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!password) {
      toast.error("Şifre gerekli");
      return;
    }
    if (password !== confirm) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Şifreniz güncellendi. Lütfen yeni şifrenizle giriş yapın.");
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border/60 p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Yönetim</p>
          <h1 className="font-display text-3xl">Yeni Şifre Belirle</h1>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground">Bağlantı doğrulanıyor…</p>
        ) : !hasSession ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bu bağlantı geçersiz veya süresi dolmuş. Lütfen giriş sayfasından
              "Şifremi unuttum" ile yeni bir bağlantı isteyin.
            </p>
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Girişe Dön
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Yeni şifre</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
            >
              {busy ? "Kaydediliyor…" : "Şifreyi Güncelle"}
            </button>
          </form>
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
