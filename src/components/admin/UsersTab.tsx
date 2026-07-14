import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  Clock,
} from "lucide-react";
import {
  adminCancelInvite,
  adminDeleteUser,
  adminInviteAdmin,
  adminListUsers,
  adminSetRole,
  type AdminUserListItem,
} from "@/lib/admin/users.functions";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

function formatDate(v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

function errorMessage(e: unknown, tu: typeof t.admin.users): string {
  const raw = e instanceof Error ? e.message : "";
  if (raw === "self_delete_blocked") return tu.errors.selfDelete;
  if (raw === "self_role_change_blocked") return tu.errors.selfRoleChange;
  if (raw === "last_admin_protected") return tu.errors.lastAdmin;
  if (raw === "Forbidden") return tu.errors.forbidden;
  return raw || t.admin.common.error;
}

export function UsersTab() {
  const qc = useQueryClient();
  const tu = t.admin.users;
  const tc = t.admin.common;

  const listFn = useServerFn(adminListUsers);
  const inviteFn = useServerFn(adminInviteAdmin);
  const setRoleFn = useServerFn(adminSetRole);
  const deleteFn = useServerFn(adminDeleteUser);
  const cancelInviteFn = useServerFn(adminCancelInvite);

  const [meId, setMeId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminUserListItem | null>(
    null,
  );

  const list = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listFn(),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const inviteMut = useMutation({
    mutationFn: (email: string) => inviteFn({ data: { email } }),
    onSuccess: (r) => {
      toast.success(r.sent ? tu.toastInviteSent : tu.toastPromoted);
      setInviteOpen(false);
      setInviteEmail("");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, tu)),
  });

  const setRoleMut = useMutation({
    mutationFn: (vars: { userId: string; makeAdmin: boolean }) =>
      setRoleFn({ data: vars }),
    onSuccess: () => {
      toast.success(tu.toastRoleUpdated);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, tu)),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      toast.success(tu.toastDeleted);
      setConfirmDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, tu)),
  });

  const cancelInviteMut = useMutation({
    mutationFn: (id: string) => cancelInviteFn({ data: { id } }),
    onSuccess: () => {
      toast.success(tu.toastInviteCancelled);
      setConfirmDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, tu)),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card border border-border/60 p-6 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl mb-1">{tu.title}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {tu.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => list.refetch()}
              disabled={list.isFetching}
              className="gap-2"
            >
              <RefreshCw
                size={14}
                className={cn(list.isFetching && "animate-spin")}
              />
              {tu.refresh}
            </Button>
            <Button
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="gap-2"
            >
              <UserPlus size={14} />
              {tu.invite}
            </Button>
          </div>
        </header>

        {list.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={16} /> {tc.loading}
          </div>
        ) : list.isError ? (
          <p className="text-sm text-destructive">{tc.error}</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {tc.empty}
          </p>
        ) : (
          <div className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tu.columns.email}</TableHead>
                  <TableHead>{tu.columns.role}</TableHead>
                  <TableHead>{tu.columns.created}</TableHead>
                  <TableHead>{tu.columns.lastSignIn}</TableHead>
                  <TableHead className="text-right">
                    {tu.columns.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((row) => {
                  const isSelf = !row.isPending && row.id === meId;
                  const busyRole =
                    setRoleMut.isPending &&
                    !row.isPending &&
                    setRoleMut.variables?.userId === row.id;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="align-top">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <Mail size={13} className="text-muted-foreground" />
                          {row.email ?? "—"}
                          {isSelf && (
                            <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5">
                              {tu.you}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {row.isPending ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 px-2.5 py-1 text-xs font-medium">
                            <Clock size={11} /> {tu.pending}
                          </span>
                        ) : row.isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                            <ShieldCheck size={11} /> {tu.roleAdmin}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border text-muted-foreground px-2.5 py-1 text-xs">
                            {tu.roleUser}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground tabular-nums">
                        {formatDate(
                          row.isPending ? row.createdAt : row.createdAt,
                        )}
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground tabular-nums">
                        {row.isPending ? "—" : formatDate(row.lastSignInAt)}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="inline-flex items-center gap-1">
                          {!row.isPending &&
                            (row.isAdmin ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                disabled={isSelf || busyRole}
                                onClick={() =>
                                  setRoleMut.mutate({
                                    userId: row.id,
                                    makeAdmin: false,
                                  })
                                }
                              >
                                {busyRole ? (
                                  <Loader2
                                    size={12}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <ShieldOff size={12} />
                                )}
                                {tu.removeAdmin}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                disabled={busyRole}
                                onClick={() =>
                                  setRoleMut.mutate({
                                    userId: row.id,
                                    makeAdmin: true,
                                  })
                                }
                              >
                                {busyRole ? (
                                  <Loader2
                                    size={12}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <ShieldCheck size={12} />
                                )}
                                {tu.makeAdmin}
                              </Button>
                            ))}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(row)}
                            disabled={!row.isPending && isSelf}
                            className="rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                            aria-label="delete"
                            title={
                              !row.isPending && isSelf
                                ? tu.errors.selfDelete
                                : undefined
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tu.inviteTitle}</DialogTitle>
            <DialogDescription>{tu.inviteDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="invite-email" className="text-xs">
              {tu.emailLabel}
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@example.com"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setInviteOpen(false)}
              disabled={inviteMut.isPending}
            >
              {tc.cancel}
            </Button>
            <Button
              onClick={() => inviteMut.mutate(inviteEmail.trim())}
              disabled={inviteMut.isPending || !inviteEmail.trim()}
              className="gap-2"
            >
              {inviteMut.isPending && (
                <Loader2 size={14} className="animate-spin" />
              )}
              {tu.sendInvite}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.isPending
                ? tu.confirmCancelInvite
                : tu.confirmDelete}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete
                ? (confirmDelete.isPending
                    ? confirmDelete.email
                    : (confirmDelete as { email: string | null }).email) ?? ""
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMut.isPending || cancelInviteMut.isPending}
            >
              {tc.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDelete) return;
                if (confirmDelete.isPending) {
                  cancelInviteMut.mutate(confirmDelete.id);
                } else {
                  deleteMut.mutate(confirmDelete.id);
                }
              }}
              disabled={deleteMut.isPending || cancelInviteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending || cancelInviteMut.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> {tc.saving}
                </>
              ) : (
                tc.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
