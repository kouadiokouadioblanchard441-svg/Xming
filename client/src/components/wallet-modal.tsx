import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Loader2, Plus, Trash2, CreditCard, Check } from "lucide-react";
import type { WithdrawalWallet } from "@shared/schema";

const walletSchemaFactory = (nameMsg: string, addrMsg: string) =>
  z.object({
    accountName: z.string().min(2, nameMsg),
    accountNumber: z.string().regex(/^0x[a-fA-F0-9]{40}$/, addrMsg),
  });

type WalletForm = { accountName: string; accountNumber: string };
const WITHDRAWAL_METHOD = "USDT BEP20";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WalletModal({ open, onClose }: WalletModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);

  const walletSchema = walletSchemaFactory(t.walletNameLabel, t.walletAddressLabel);

  const { data: wallets, isLoading } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
    enabled: open,
  });

  const form = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: { accountName: "", accountNumber: "" },
  });

  const addMutation = useMutation({
    mutationFn: async (data: WalletForm) => {
      const response = await apiRequest("POST", "/api/wallets", {
        ...data,
        paymentMethod: WITHDRAWAL_METHOD,
        country: user!.country,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: t.walletAdded });
      form.reset();
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("DELETE", `/api/wallets/${walletId}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: t.walletDeleted });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("PATCH", `/api/wallets/${walletId}/default`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: t.walletDefaultUpdated });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.walletTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : wallets && wallets.length > 0 ? (
            wallets.map((wallet) => (
              <Card key={wallet.id} className={wallet.isDefault ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{wallet.accountName}</p>
                        <p className="text-sm text-muted-foreground">{wallet.accountNumber}</p>
                        <p className="text-xs text-muted-foreground">USDT BEP20</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!wallet.isDefault && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDefaultMutation.mutate(wallet.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(wallet.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {wallet.isDefault && (
                    <div className="mt-2">
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{t.walletDefault}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : !showForm ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">{t.walletNone}</p>
            </div>
          ) : null}

          {showForm ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.walletNameLabel}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.walletNamePlaceholder} data-testid="input-wallet-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.walletAddressLabel}</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="0x..." data-testid="input-wallet-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {t.walletOnlyMethod} : <span className="font-semibold text-foreground">USDT BEP20</span>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    {t.cancel}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={addMutation.isPending}>
                    {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.walletAddLabel}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Button className="w-full" onClick={() => setShowForm(true)} data-testid="button-add-wallet">
              <Plus className="w-4 h-4 mr-2" />
              {t.walletAddBtn}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
