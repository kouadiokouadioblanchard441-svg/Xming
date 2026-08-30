import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Check, X, Ban, Search, Loader2, ImageIcon, MessageSquare } from "lucide-react";
import type { Deposit } from "@shared/schema";

interface DepositWithUser extends Deposit {
  user: {
    id: number;
    fullName: string;
    phone: string;
    country: string;
    isPromoter: boolean;
  };
}

export default function AdminDeposits() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "approved" | "rejected">("pending");
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);

  const { data: allDeposits, isLoading } = useQuery<DepositWithUser[]>({
    queryKey: ["/api/admin/deposits"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/deposits?status=all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deposits");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const deposits = allDeposits?.filter(d =>
    statusFilter === "all" ? true : d.status === statusFilter
  );

  const processMutation = useMutation({
    mutationFn: async ({ id, action, ban }: { id: number; action: "approve" | "reject"; ban?: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/deposits/${id}/${action}`, { ban });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t.depositProcessed });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const filteredDeposits = deposits?.filter(d =>
    d.accountNumber.includes(filter) ||
    d.user.phone.includes(filter) ||
    d.user.fullName.toLowerCase().includes(filter.toLowerCase()) ||
    (d.reference && d.reference.toLowerCase().includes(filter.toLowerCase())) ||
    ((d as any).channelName && (d as any).channelName.toLowerCase().includes(filter.toLowerCase())) ||
    String(d.id).includes(filter)
  ) || [];

  const pendingCount = allDeposits?.filter(d => d.status === "pending").length || 0;
  const processingCount = allDeposits?.filter(d => d.status === "processing").length || 0;

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            {pendingCount} dépôt{pendingCount > 1 ? "s" : ""} en attente de validation
          </p>
        </div>
      )}


      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.adminSearchDeposit}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
            data-testid="input-search-deposits"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["pending", "processing", "approved", "rejected", "all"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
            className="whitespace-nowrap"
            data-testid={`button-filter-${status}`}
          >
            {status === "all" ? t.bankerAll : status === "pending" ? `${t.statusPending}${pendingCount > 0 ? ` (${pendingCount})` : ""}` : status === "processing" ? `${t.statusProcessing}${processingCount > 0 ? ` (${processingCount})` : ""}` : status === "approved" ? t.statusApproved : t.statusRejected}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-52" />)
        ) : filteredDeposits.length > 0 ? (
          filteredDeposits.map((deposit) => {
            const isNowPayments = deposit.paymentMethod === "NOWPayments";
            const isManual = !isNowPayments && (!!(deposit as any).paymentNumberId || !!(deposit as any).channelName);
            return (
              <Card key={deposit.id} className={deposit.status === "pending" ? "border-yellow-400/50" : deposit.status === "processing" ? "border-blue-400/50" : ""}>
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{deposit.user.fullName}</p>
                        {deposit.user.isPromoter && <Badge className="text-xs">Promoteur</Badge>}
                        {isNowPayments && (
                          <Badge className="text-xs bg-blue-600 text-white border-blue-600">
                            🔗 NOWPayments
                          </Badge>
                        )}
                        {isManual && (
                          <Badge className="text-xs bg-red-600 text-white border-red-600">
                            Paiement manuel
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{deposit.user.phone} · {deposit.user.country}</p>
                    </div>
                    <Badge
                      variant={deposit.status === "pending" ? "secondary" : deposit.status === "approved" ? "default" : deposit.status === "processing" ? "outline" : "destructive"}
                      className={deposit.status === "processing" ? "bg-blue-600 text-white border-blue-600" : ""}
                    >
                      {deposit.status === "pending" ? t.statusPending : deposit.status === "processing" ? t.statusProcessing : deposit.status === "approved" ? t.statusApproved : t.statusRejected}
                    </Badge>
                  </div>

                  {/* Main info */}
                  <div className="grid grid-cols-2 gap-2 text-sm bg-secondary/50 rounded-xl p-3">
                    <div>
                      <p className="text-muted-foreground text-xs">{t.amount}</p>
                      <p className="font-bold text-lg text-primary">{deposit.amount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{t.operator}</p>
                      <p className="font-medium">{deposit.paymentMethod}</p>
                    </div>
                    <div className={isNowPayments ? "col-span-2" : ""}>
                      <p className="text-muted-foreground text-xs">{isNowPayments ? "Adresse crypto" : t.payerNumber}</p>
                      <p className="font-mono font-medium break-all text-xs">{deposit.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{t.date}</p>
                      <p className="font-medium text-xs">
                        {new Date(deposit.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })}
                        {" "}
                        {new Date(deposit.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Payment number (channel) used */}
                    {(deposit as any).channelName && !isNowPayments && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">{t.recipientNumber}</p>
                        <p className="font-bold text-red-600">{(deposit as any).channelName}</p>
                      </div>
                    )}
                    {(deposit as any).channelName && isNowPayments && (
                      <div>
                        <p className="text-muted-foreground text-xs">Réseau</p>
                        <p className="font-bold text-blue-600">{(deposit as any).channelName}</p>
                      </div>
                    )}

                    {/* Reference */}
                    {(deposit as any).reference && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">{t.reference}</p>
                        <p className="font-mono font-medium">{(deposit as any).reference}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment message */}
                  {(deposit as any).paymentMessage && (
                    <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-600" />
                        <p className="text-xs font-medium text-gray-600">{t.paymentMessageReceived}</p>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{(deposit as any).paymentMessage}</p>
                    </div>
                  )}

                  {/* Screenshot */}
                  {(deposit as any).screenshot && (
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">{t.screenshot}</p>
                      </div>
                      <button
                        onClick={() => setScreenshotModal((deposit as any).screenshot)}
                        className="w-full rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                        data-testid={`button-screenshot-${deposit.id}`}
                      >
                        <img
                          src={(deposit as any).screenshot}
                          alt="Capture"
                          className="w-full max-h-40 object-contain bg-secondary/30"
                        />
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  {(deposit.status === "pending" || deposit.status === "processing") && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => processMutation.mutate({ id: deposit.id, action: "approve" })}
                        disabled={processMutation.isPending}
                        data-testid={`button-approve-${deposit.id}`}
                      >
                        {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />{t.approve}</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processMutation.mutate({ id: deposit.id, action: "reject" })}
                        disabled={processMutation.isPending}
                        data-testid={`button-reject-${deposit.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />{t.reject}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => processMutation.mutate({ id: deposit.id, action: "reject", ban: true })}
                        disabled={processMutation.isPending}
                        title={t.rejectAndBan}
                        data-testid={`button-ban-${deposit.id}`}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t.noDeposits}
          </div>
        )}
      </div>

      {/* Screenshot modal */}
      <Dialog open={!!screenshotModal} onOpenChange={() => setScreenshotModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.screenshot}</DialogTitle>
          </DialogHeader>
          {screenshotModal && (
            <img src={screenshotModal} alt="Capture" className="w-full rounded-xl object-contain max-h-[70vh]" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
