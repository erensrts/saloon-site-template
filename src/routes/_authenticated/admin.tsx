import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/auth.functions";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicesTab } from "@/components/admin/ServicesTab";
import { WorkingHoursTab } from "@/components/admin/WorkingHoursTab";

import { t } from "@/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Paneli" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ta = t.admin;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => getMyRole(),
    staleTime: 60_000,
  });

  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Çıkış yapıldı");
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data?.isAdmin) {
    return (
      <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl bg-card border border-border/60 p-8 text-center">
          <ShieldAlert className="text-primary mx-auto mb-4" size={40} />
          <h1 className="font-display text-2xl mb-2">Yetkisiz Erişim</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Bu hesabın admin rolü yok. Bir admin size rol atadıktan sonra tekrar deneyin.
          </p>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
          <Toaster position="top-center" richColors />
        </div>
      </div>
    );
  }

  const placeholderTabs: { value: string; label: string }[] = [
    { value: "appointments", label: ta.tabs.appointments },
    { value: "slots", label: ta.tabs.slots },
    { value: "gallery", label: ta.tabs.gallery },
    { value: "content", label: ta.tabs.content },
  ];


  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container-narrow flex h-16 items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">
              {ta.eyebrow}
            </p>
            <p className="font-display text-lg leading-none">{ta.title}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {email && (
              <span className="text-muted-foreground hidden sm:inline">{email}</span>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 hover:bg-accent transition"
            >
              <LogOut size={14} /> {ta.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="container-narrow py-8 md:py-10">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-1 bg-card border border-border/60 p-1 rounded-2xl mb-6">
            <TabsTrigger value="services" className="rounded-xl">
              {ta.tabs.services}
            </TabsTrigger>
            <TabsTrigger value="hours" className="rounded-xl">
              {ta.tabs.hours}
            </TabsTrigger>
            {placeholderTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="services" className="mt-0">
            <ServicesTab />
          </TabsContent>

          <TabsContent value="hours" className="mt-0">
            <WorkingHoursTab />
          </TabsContent>


          {placeholderTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <div className="rounded-2xl bg-card border border-dashed border-border/70 p-10 text-center text-muted-foreground">
                <p className="font-display text-xl mb-1">{tab.label}</p>
                <p className="text-sm">{ta.common.soon}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
