import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Check, X, Search, Loader2, ShieldCheck, HandCoins, Zap } from "lucide-react";
import type { Withdrawal } from "@shared/schema";

interface WithdrawalWithUser extends Withdrawal {
  user: {
    id: number;
    fullName: string;
    phone: string;
    country: string;
    isPromoter: boolean;
  };
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "pending_2fa" | "processing" | "approved" | "rejected" | "failed">("pending");
  const [verificationCodes, setVerificationCodes] = useState<Record<number, string>>({});
  const [modeToggling, setModeToggling] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const withdrawalMode = settings?.withdrawalMode || "manual";
  const isManual = withdrawalMode === "manual";

  const toggleMode = async () => {
    const newMode = isManual ? "auto" : "manual";
    setModeToggling(true);
    try {
      const response = await apiRequest("POST", "/api/admin/settings", { withdrawalMode: newMode });
      if (!response.ok) throw new Error(t.adminWithdrawalServerError);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: newMode === "manual" ? t.adminManualModeActivated : t.adminAutoModeActivated,
      });
    } catch (e: any) {
      toast({ title: e.message || t.errorOccurred, variant: "destructive" });
    } finally {
      setModeToggling(false);
    }
  };

  const { data: allWithdrawals, isLoading } = useQuery<WithdrawalWithUser[]>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/withdrawals?status=all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      return res.json();
    },
  });

  const withdrawals = allWithdrawals?.filter(w =>
    statusFilter === "all" ? true : w.status === statusFilter
  );

  const processMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      const response = await apiRequest("POST", `/api/admin/withdrawals/${id}/${action}`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t.withdrawalProcessed });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, verificationCode }: { id: number; verificationCode: string }) => {
      const response = await apiRequest("POST", `/api/admin/withdrawals/${id}/verify-nowpayments`, { verificationCode });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t.adminWithdrawal2FAFailed);
      return data;
    },
    onSuccess: (_data, variables) => {
      setVerificationCodes((current) => ({ ...current, [variables.id]: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t.adminWithdrawal2FAValidated, description: t.adminWithdrawal2FAProcessing });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.adminWithdrawal2FAFailed, variant: "destructive" });
    },
  });

  const filteredWithdrawals = withdrawals?.filter(w =>
    w.accountNumber.includes(filter) ||
    w.user.phone.includes(filter) ||
    w.user.fullName.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">

      {/* ── Bandeau mode retrait ── */}
      <div className={`rounded-xl border-2 p-3 flex items-center justify-between gap-3 ${isManual ? "border-orange-400/60 bg-orange-50/50 dark:bg-orange-950/20" : "border-blue-400/60 bg-blue-50/50 dark:bg-blue-950/20"}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isManual
            ? <HandCoins className="w-5 h-5 text-orange-500 shrink-0" />
            : <Zap className="w-5 h-5 text-blue-500 shrink-0" />}
          <div className="min-w-0">
            <p className={`text-sm font-bold ${isManual ? "text-orange-700 dark:text-orange-300" : "text-blue-700 dark:text-blue-300"}`}>
              {isManual ? t.adminManualModeLabel : t.adminAutoModeLabel}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isManual ? t.adminManualModeDesc : t.adminAutoModeDesc}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className={`shrink-0 ${isManual ? "border-blue-400 text-blue-600 hover:bg-blue-50" : "border-orange-400 text-orange-600 hover:bg-orange-50"}`}
          disabled={modeToggling}
          onClick={toggleMode}
        >
          {modeToggling
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : isManual
              ? <><Zap className="w-3 h-3 mr-1" />{t.adminWithdrawalAutoBtn}</>
              : <><HandCoins className="w-3 h-3 mr-1" />{t.adminWithdrawalManualBtn}</>}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.adminWithdrawalSearchPlaceholder}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["all", "pending", "pending_2fa", "processing", "approved", "rejected", "failed"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all"
              ? t.bankerAll
              : status === "pending"
                ? t.statusPending
                : status === "pending_2fa"
                  ? t.adminWithdrawal2FALabel
                  : status === "processing"
                    ? t.statusProcessing
                    : status === "approved"
                      ? t.statusApproved
                      : status === "failed"
                        ? t.statusFailed
                        : t.statusRejected}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)
        ) : filteredWithdrawals.length > 0 ? (
          filteredWithdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{withdrawal.user.fullName}</p>
                      {withdrawal.user.isPromoter && <Badge className="text-xs">{t.promoter}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{withdrawal.user.phone}</p>
                    <p className="text-sm text-muted-foreground">{t.country}: {withdrawal.user.country}</p>
                  </div>
                  <Badge variant={
                    withdrawal.status === "pending" ? "secondary" :
                    withdrawal.status === "approved" ? "default" :
                    withdrawal.status === "processing" || withdrawal.status === "pending_2fa" ? "outline" : "destructive"
                  }>
                    {withdrawal.status === "pending"
                      ? t.statusPending
                      : withdrawal.status === "pending_2fa"
                        ? t.adminWithdrawal2FALabel
                        : withdrawal.status === "processing"
                          ? t.statusProcessing
                          : withdrawal.status === "approved"
                            ? t.statusApproved
                            : withdrawal.status === "failed"
                              ? t.statusFailed
                              : t.statusRejected}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t.grossAmount}</p>
                      <p className="font-medium text-foreground">{withdrawal.amount.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.netAmount}</p>
                      <p className="font-medium text-primary">{withdrawal.netAmount.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.fees}</p>
                      <p className="font-medium text-destructive">{withdrawal.fees.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.method}</p>
                    <p className="font-medium text-foreground">{withdrawal.paymentMethod || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Numéro / Nom</p>
                    <p className="font-medium text-foreground">{withdrawal.accountNumber} — {withdrawal.accountName}</p>
                  </div>
                  {withdrawal.nowPaymentsPayoutId && (
                    <div className="col-span-2 text-xs text-muted-foreground">
                      {t.adminWithdrawalPayoutId} {withdrawal.nowPaymentsPayoutId}
                      {withdrawal.nowPaymentsStatus ? ` · ${withdrawal.nowPaymentsStatus}` : ""}
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-muted-foreground">{t.dateTime}</p>
                    <p className="font-medium text-foreground">
                      {new Date(withdrawal.createdAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })} à {new Date(withdrawal.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                {withdrawal.status === "pending_2fa" && (
                  <div className="rounded-lg border border-amber-400/40 bg-amber-50/60 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                      <ShieldCheck className="w-4 h-4" />
                      {t.enter2FACode}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={verificationCodes[withdrawal.id] || ""}
                        onChange={(event) =>
                          setVerificationCodes((current) => ({
                            ...current,
                            [withdrawal.id]: event.target.value.replace(/\D/g, "").slice(0, 6),
                          }))
                        }
                      />
                      <Button
                        onClick={() => verifyMutation.mutate({
                          id: withdrawal.id,
                          verificationCode: verificationCodes[withdrawal.id] || "",
                        })}
                        disabled={verifyMutation.isPending || (verificationCodes[withdrawal.id] || "").length !== 6}
                      >
                        {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.approve}
                      </Button>
                    </div>
                  </div>
                )}

                {withdrawal.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => processMutation.mutate({ id: withdrawal.id, action: "approve" })}
                      disabled={processMutation.isPending}
                      data-testid={`button-approve-${withdrawal.id}`}
                    >
                      {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> {t.approve}</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => processMutation.mutate({ id: withdrawal.id, action: "reject" })}
                      disabled={processMutation.isPending}
                      data-testid={`button-reject-${withdrawal.id}`}
                    >
                      <X className="w-4 h-4 mr-1" /> {t.reject}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t.adminNoWithdrawals}
          </div>
        )}
      </div>
    </div>
  );
}
