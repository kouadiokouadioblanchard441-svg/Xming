import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, getCountryByCode } from "@/lib/countries";
import { Loader2, AlertTriangle, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@shared/schema";

const poweraddLogo = "/poweradd/poweradd-logo-official.png";
import serviceIcon from "@assets/20260311_214852_1773265973964.png";
import productImgFallback from "@assets/vestas_112v_closeup_1783210181172.jpg";

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  ownedCount?: number;
}

export default function InvestPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmProduct, setConfirmProduct] = useState<ProductWithOwnership | null>(null);

  const { data: products, isLoading } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      setConfirmProduct(null);
      toast({ title: t.purchaseSuccess, description: t.purchaseSuccessDescription });
    },
    onError: (error: any) => {
      setConfirmProduct(null);
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");
  const country = getCountryByCode(user.country);
  const currency = "FCFA";
  const paidProducts = products?.filter(p => !p.isFree) || [];

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#000000" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shadow-sm" style={{ background: "linear-gradient(135deg, #E8192C 0%, #001a40 100%)" }}>
        <img src={poweraddLogo} alt="Power Add" className="h-8 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        <button onClick={() => navigate("/service")} className="flex items-center justify-center" data-testid="button-service">
          <img src={serviceIcon} alt={t.customerService} className="w-8 h-8 object-contain" />
        </button>
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto pb-16 px-2 pt-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        ) : paidProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {paidProducts.map((product) => {
              const img = product.imageUrl || productImgFallback;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="text-center pt-3 pb-1 px-2">
                    <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                  </div>

                  <div className="mx-3 my-2 rounded-xl overflow-hidden" style={{ height: 110 }}>
                    <img src={img} alt={product.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="px-3 pb-1 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.price}</span>
                      <span className="font-bold text-[11px]" style={{ color: "#E8192C" }}>
                        {currency} {Number(product.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.dailyRevenue}</span>
                      <span className="font-bold text-[11px]" style={{ color: "#E8192C" }}>
                        {currency} {Number(product.dailyEarnings).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.totalRevenue}</span>
                      <span className="font-bold text-[11px]" style={{ color: "#E8192C" }}>
                        {currency} {Number(product.totalReturn).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.period}</span>
                      <span className="font-bold text-[11px]" style={{ color: "#E8192C" }}>
                        {product.cycleDays} {t.ordersDaysLbl}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto px-3 pb-3 pt-2">
                    <p className="text-gray-800 font-black text-base text-center mb-2">
                      {currency} {Number(product.price).toLocaleString()}
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setConfirmProduct(product)}
                        className="px-6 py-1.5 rounded-lg text-sm font-bold text-white shadow"
                        style={{ background: "#E8192C" }}
                        data-testid={`button-purchase-${product.id}`}
                      >
                        {t.buy}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/70">{t.noProducts}</p>
          </div>
        )}
      </div>

      {/* Purchase confirm modal */}
      {confirmProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/60"
          onClick={() => setConfirmProduct(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(160deg, #E8192C 0%, #001a40 100%)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="pt-6 px-6 pb-3">
              <h3 className="text-white text-2xl font-black">{confirmProduct.name}</h3>
              <p className="text-white/70 text-sm mt-1">{t.investConfirmDesc}</p>
            </div>

            <div className="flex items-center gap-4 px-6 py-3">
              <div className="w-28 h-24 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                <img
                  src={confirmProduct.imageUrl || productImgFallback}
                  alt={confirmProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="text-white/60 text-xs">{t.price}</p>
                  <p className="text-white font-bold text-sm">{currency} {Number(confirmProduct.price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">{t.dailyRevenue}</p>
                  <p className="text-white font-bold text-sm">{currency} {Number(confirmProduct.dailyEarnings).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">{t.totalRevenue}</p>
                  <p className="text-white font-bold text-sm">{currency} {Number(confirmProduct.totalReturn).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">{t.investCycleDays}</p>
                  <p className="text-white font-bold text-sm">{confirmProduct.cycleDays} {t.ordersDaysLbl}</p>
                </div>
              </div>
            </div>

            <div className="mx-6 mb-3">
              {balance < parseFloat(String(confirmProduct.price)) ? (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/20 border border-red-400/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
                  <p className="text-xs text-red-200">
                    {t.investInsufficient.replace("{0}", formatCurrency(parseFloat(String(confirmProduct.price)) - balance, user.country))}
                  </p>
                </div>
              ) : (
                <p className="text-white/70 text-xs text-center font-semibold">
                  {t.investOnePerDay}
                </p>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-1">
              <button
                onClick={() => setConfirmProduct(null)}
                className="flex-1 py-3 rounded-full font-semibold text-sm"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
                data-testid="button-cancel-purchase"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => purchaseMutation.mutate(confirmProduct.id)}
                disabled={purchaseMutation.isPending || balance < parseFloat(String(confirmProduct.price))}
                className="flex-1 py-3 rounded-full text-white font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                style={{ background: "#E8192C" }}
                data-testid="button-confirm-purchase"
              >
                {purchaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
