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
import { SlotsTab } from "@/components/admin/SlotsTab";
import { GalleryTab } from "@/components/admin/GalleryTab";
import { AppointmentsTab } from "@/components/admin/AppointmentsTab";
import { ContentTab } from "@/components/admin/ContentTab";
import { UsersTab } from "@/components/admin/UsersTab";

import { ChangePasswordDialog } from "@/components/admin/ChangePasswordDialog";



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

  if (isError) {
    return (
      <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl bg-card border border-border/60 p-8 text-center">
          <ShieldAlert className="text-primary mx-auto mb-4" size={40} />
          <h1 className="font-display text-2xl mb-2">Bir hata oluştu</h1>
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

  const isAdmin = Boolean(data?.isAdmin);

  const placeholderTabs: { value: string; label: string }[] = [];




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
            <ChangePasswordDialog email={email} />
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
        {!isAdmin && (
          <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>
              Salt-okunur görüntüleme modu. Değişiklik yapabilmek için admin rolüne ihtiyacınız var.
            </span>
          </div>
        )}
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-1 bg-card border border-border/60 p-1 rounded-2xl mb-6">
            <TabsTrigger value="appointments" className="rounded-xl">
              {ta.tabs.appointments}
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl">
              {ta.tabs.services}
            </TabsTrigger>
            <TabsTrigger value="hours" className="rounded-xl">
              {ta.tabs.hours}
            </TabsTrigger>
            <TabsTrigger value="slots" className="rounded-xl">
              {ta.tabs.slots}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-xl">
              {ta.tabs.gallery}
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl">
              {ta.tabs.content}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="rounded-xl">
                {ta.tabs.users}
              </TabsTrigger>
            )}
            {placeholderTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <fieldset
            disabled={!isAdmin}
            className={!isAdmin ? "min-w-0 opacity-95" : "min-w-0"}
          >
            <TabsContent value="appointments" className="mt-0">
              <AppointmentsTab />
            </TabsContent>
            <TabsContent value="services" className="mt-0">
              <ServicesTab />
            </TabsContent>
            <TabsContent value="hours" className="mt-0">
              <WorkingHoursTab />
            </TabsContent>
            <TabsContent value="slots" className="mt-0">
              <SlotsTab />
            </TabsContent>
            <TabsContent value="gallery" className="mt-0">
              <GalleryTab />
            </TabsContent>
            <TabsContent value="content" className="mt-0">
              <ContentTab />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <UsersTab />
            </TabsContent>

            {placeholderTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <div className="rounded-2xl bg-card border border-dashed border-border/70 p-10 text-center text-muted-foreground">
                  <p className="font-display text-xl mb-1">{tab.label}</p>
                  <p className="text-sm">{ta.common.soon}</p>
                </div>
              </TabsContent>
            ))}
          </fieldset>
        </Tabs>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
