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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPaymentMethodsForCountry, formatCurrency } from "@/lib/countries";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { PaymentChannel } from "@shared/schema";

const depositSchema = z.object({
  amount: z.string().min(1),
  accountName: z.string().min(2),
  accountNumber: z.string().min(8),
  paymentMethod: z.string().min(2),
  paymentChannelId: z.string().min(1),
});

type DepositForm = z.infer<typeof depositSchema>;

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DepositModal({ open, onClose }: DepositModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [step, setStep] = useState<"amount" | "details">("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const { data: channels } = useQuery<PaymentChannel[]>({
    queryKey: ["/api/payment-channels"],
    enabled: open,
  });

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      accountName: "",
      accountNumber: "",
      paymentMethod: "",
      paymentChannelId: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      const response = await apiRequest("POST", "/api/deposits", {
        amount: parseInt(data.amount),
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        country: user!.country,
        paymentMethod: data.paymentMethod,
        paymentChannelId: parseInt(data.paymentChannelId),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      refreshUser();
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      }
      toast({ title: t.depositSubmitted, description: t.depositSubmittedDesc });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setStep("amount");
    setSelectedAmount(null);
    form.reset();
    onClose();
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    form.setValue("amount", amount.toString());
    setStep("details");
  };

  const handleCustomAmount = () => {
    const amount = parseInt(form.getValues("amount"));
    if (amount >= 2000) {
      setSelectedAmount(amount);
      setStep("details");
    } else {
      toast({ title: t.invalidAmount, description: `${t.minAmountPrefix} 2 USDT`, variant: "destructive" });
    }
  };

  if (!user) return null;

  const paymentMethods = getPaymentMethodsForCountry(user.country);
  const activeChannels = channels?.filter(c => c.isActive) || [];
  const presetAmounts = [2000, 5000, 10000, 20000, 50000, 100000];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "amount" ? t.deposit : t.depositPaymentInfo}
          </DialogTitle>
        </DialogHeader>

        {step === "amount" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.depositMinDesc} {formatCurrency(2000, user.country)}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => handleAmountSelect(amount)}
                  data-testid={`button-amount-${amount}`}
                >
                  {formatCurrency(amount, user.country)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t.depositCustomAmountPlaceholder}
                value={form.watch("amount")}
                onChange={(e) => form.setValue("amount", e.target.value)}
                data-testid="input-custom-amount"
              />
              <Button onClick={handleCustomAmount} data-testid="button-custom-amount">
                {t.depositContinueBtn}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => depositMutation.mutate(data))} className="space-y-4">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">{t.depositAmountLbl}</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedAmount || 0, user.country)}
                </p>
              </div>

              <FormField
                control={form.control}
                name="paymentChannelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.depositChannelLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-channel">
                          <SelectValue placeholder={t.depositSelectChannel} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id.toString()}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.depositAccountNameLabel}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.walletNamePlaceholder} data-testid="input-account-name" />
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
                    <FormLabel>{t.depositAccountNumberLabel}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder={t.depositAccountNumberPlaceholder} data-testid="input-account-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.depositPaymentMethodLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder={t.depositSelectOption} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep("amount")} className="flex-1">
                  {t.back}
                </Button>
                <Button type="submit" className="flex-1" disabled={depositMutation.isPending} data-testid="button-submit-deposit">
                  {depositMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t.depositSubmitPayment
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
