import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Wallet } from "lucide-react";
import type { WithdrawalWallet } from "@shared/schema";

const withdrawSchemaFactory = (msg: string) =>
  z.object({ amount: z.string().min(1, msg) });

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const withdrawSchema = withdrawSchemaFactory(t.invalidAmount);
  type WithdrawForm = z.infer<typeof withdrawSchema>;

  const { data: wallets } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
    enabled: open,
  });

  const { data: withdrawalSettings } = useQuery<{
    withdrawalEnabled: boolean;
    withdrawalFees: number;
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    maxWithdrawalsPerDay: number;
    minWithdrawal: number;
  }>({
    queryKey: ["/api/settings/withdrawal"],
    enabled: open,
  });

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: "" },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawForm) => {
      const response = await apiRequest("POST", "/api/withdrawals", {
        amount: parseInt(data.amount),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      refreshUser();
      toast({ title: t.withdrawSuccess, description: t.withdrawSuccessDesc });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");
  const defaultWallet = wallets?.find(w => w.isDefault);
  const withdrawalEnabled = withdrawalSettings?.withdrawalEnabled ?? true;
  const fees = withdrawalSettings?.withdrawalFees || 15;
  const minWithdrawal = withdrawalSettings?.minWithdrawal || 1;
  const currency = "USDT";

  const amount = parseInt(form.watch("amount") || "0");
  const feeAmount = Math.round(amount * fees / 100);
  const netAmount = amount - feeAmount;

  const canWithdraw = withdrawalEnabled && user.hasDeposited && user.hasActiveProduct && !user.isWithdrawalBlocked && defaultWallet;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.withdrawTitle}</DialogTitle>
          <DialogDescription>
            {t.withdrawMinFee.replace("{0}", String(minWithdrawal)).replace("{1}", String(fees))}
          </DialogDescription>
        </DialogHeader>

        {!canWithdraw ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">{t.withdrawNotAvailable}</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {!user.hasDeposited && <li>- {t.withdrawNeedDeposit}</li>}
                  {!user.hasActiveProduct && <li>- {t.withdrawNeedProduct}</li>}
                  {!defaultWallet && <li>- {t.withdrawNeedWallet}</li>}
                  {user.isWithdrawalBlocked && <li>- {t.withdrawBlocked}</li>}
                  {user.mustInviteToWithdraw && <li>- {t.withdrawMustInvite}</li>}
                  {!withdrawalEnabled && <li>- {t.withdrawAdminDisabled}</li>}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => withdrawMutation.mutate(data))} className="space-y-4">
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t.withdrawWalletLabel}</span>
                </div>
                <p className="font-medium text-foreground">{defaultWallet?.accountName}</p>
                <p className="text-sm text-muted-foreground">{defaultWallet?.accountNumber} - USDT BEP20</p>
              </div>

              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">{t.withdrawAvailableBalance}</p>
                <p className="text-xl font-bold text-foreground">{balance.toLocaleString()} {currency}</p>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.withdrawAmountLabel}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder={t.withdrawMinPlaceholder.replace("{0}", String(minWithdrawal))}
                        data-testid="input-withdraw-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {amount >= 1 && (
                <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.withdrawAmountRow}</span>
                    <span className="text-foreground">{amount.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.depositSec1} ({fees}%)</span>
                    <span className="text-destructive">-{feeAmount.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-foreground">{t.withdrawNetAmount}</span>
                    <span className="font-bold text-primary">{netAmount.toLocaleString()} {currency}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={withdrawMutation.isPending || amount < minWithdrawal || amount > balance}
                data-testid="button-submit-withdraw"
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.withdrawSubmitBtn
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
