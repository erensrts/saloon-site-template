import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin } from "@/lib/auth.functions";
import { Toaster } from "@/components/ui/sonner";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Yönetim Girişi" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: search.redirect ? "/admin" : "/admin" });
    }
  },
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const goToAdmin = () => {
    const target = search.redirect ?? "/admin";
    navigate({ to: target.startsWith("/") ? target : "/admin", replace: true });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Giriş başarılı");
        goToAdmin();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;

        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          try {
            const res = await claimFirstAdmin();
            if (res.claimed) {
              toast.success("Hesap oluşturuldu — ilk admin olarak atandınız.");
            } else {
              toast.success("Hesap oluşturuldu. Bir admin size rol atayana kadar panel kısıtlı olacak.");
            }
          } catch {
            toast.success("Hesap oluşturuldu.");
          }
          goToAdmin();
        } else {
          toast.success("Doğrulama e-postası gönderildi. Onayladıktan sonra giriş yapın.");
          setMode("signin");
        }
      } else {
        // forgot password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
        setMode("signin");
        setPassword("");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "signin" ? "Giriş Yap" : mode === "signup" ? "Hesap Oluştur" : "Şifremi Unuttum";

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border/60 p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Yönetim</p>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "forgot"
              ? "E-posta adresinize sıfırlama bağlantısı göndereceğiz."
              : "Yalnızca site yöneticileri içindir."}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="flex gap-1 mb-6 rounded-full bg-muted p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-2 transition ${
                mode === "signin" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
              }`}
            >
              Giriş
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 transition ${
                mode === "signup" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
              }`}
            >
              Kayıt
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Şifre</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
          >
            {busy
              ? "…"
              : mode === "signin"
              ? "Giriş Yap"
              : mode === "signup"
              ? "Hesap Oluştur"
              : "Sıfırlama Bağlantısı Gönder"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-primary hover:underline"
            >
              Şifremi unuttum
            </button>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              ← Girişe dön
            </button>
          )}
        </div>

        {mode === "signup" && (
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Kayıt olan <strong>ilk kullanıcı</strong> otomatik olarak admin olur.
          </p>
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
