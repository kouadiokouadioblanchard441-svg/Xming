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

const xpengLogo = "/xpeng-logo-white.svg";
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
        <img src={xpengLogo} alt="XPENG" className="h-8 w-auto object-contain" />
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

      {/* ══ Purchase confirm modal ══ */}
      {confirmProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          style={{ alignItems: "center" }}
          onClick={() => setConfirmProduct(null)}
        >
          <div
            className="w-full mx-4 rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "#ffffff", maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Image produit centrée ── */}
            <div
              className="flex items-center justify-center"
              style={{ background: "#f8f8f8", height: 200 }}
            >
              <img
                src={confirmProduct.imageUrl || productImgFallback}
                alt={confirmProduct.name}
                style={{ height: 180, maxWidth: "90%", objectFit: "contain" }}
              />
            </div>

            {/* ── Prix + nom ── */}
            <div className="px-5 pt-4 pb-2">
              <p
                className="font-black"
                style={{ fontSize: 24, color: "#E8192C", lineHeight: 1.2 }}
              >
                {currency} {Number(confirmProduct.price).toLocaleString()}
              </p>
              <p style={{ fontSize: 14, color: "#555", marginTop: 2 }}>
                {confirmProduct.name}
              </p>
            </div>

            {/* ── Séparateur ── */}
            <div style={{ height: 1, background: "#f0f0f0", margin: "0 20px" }} />

            {/* ── Description ── */}
            <div className="px-5 py-3 text-center">
              <p style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>
                Revenus crédités toutes les 24 h
              </p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.5 }}>
                Vous pouvez acheter plusieurs appareils pour augmenter vos revenus
              </p>
            </div>

            {/* ── Alerte solde insuffisant ── */}
            {balance < parseFloat(String(confirmProduct.price)) && (
              <div className="mx-5 mb-2 flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "#fff2f2", border: "1px solid #fca5a5" }}>
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#E8192C" }} />
                <p className="text-xs" style={{ color: "#E8192C" }}>
                  {t.investInsufficient.replace("{0}", formatCurrency(parseFloat(String(confirmProduct.price)) - balance, user.country))}
                </p>
              </div>
            )}

            {/* ── Stats 3 colonnes ── */}
            <div
              className="flex"
              style={{
                margin: "0 20px 16px",
                border: "1px solid #eee",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {[
                { value: `${confirmProduct.cycleDays} jours`, label: "Durée" },
                { value: `${currency} ${Number(confirmProduct.dailyEarnings).toLocaleString()}`, label: "Revenu quotidien" },
                { value: `${currency} ${Number(confirmProduct.totalReturn).toLocaleString()}`, label: "Revenu total" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center py-3"
                  style={{ borderRight: i < 2 ? "1px solid #eee" : "none" }}
                >
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#E8192C", lineHeight: 1.3 }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: 11, color: "#888", marginTop: 2, textAlign: "center", lineHeight: 1.3 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Boutons ── */}
            <div
              className="flex"
              style={{ borderTop: "1px solid #f0f0f0" }}
            >
              <button
                onClick={() => setConfirmProduct(null)}
                className="flex-1 font-semibold active:opacity-70 transition-opacity"
                style={{
                  padding: "17px 0",
                  fontSize: 16,
                  color: "#555",
                  background: "#e8e8e8",
                  border: "none",
                  borderBottomLeftRadius: 24,
                }}
                data-testid="button-cancel-purchase"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => purchaseMutation.mutate(confirmProduct.id)}
                disabled={purchaseMutation.isPending || balance < parseFloat(String(confirmProduct.price))}
                className="flex-1 font-bold text-white flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50 transition-opacity"
                style={{
                  padding: "17px 0",
                  fontSize: 16,
                  background: "#E8192C",
                  border: "none",
                  borderBottomRightRadius: 24,
                }}
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
