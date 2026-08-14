import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@shared/schema";

import productImgFallback from "@assets/vestas_112v_closeup_1783210181172.jpg";

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  ownedCount?: number;
}

/* ── Info row inside card ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between" style={{ marginBottom: 4 }}>
      <span style={{ color: "#777", fontSize: 12, fontWeight: 400, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ color: "#111", fontSize: 13, fontWeight: 700, marginLeft: 6 }}>
        {value}
      </span>
    </div>
  );
}

export default function ProductsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const { data: products, isLoading: productsLoading } = useQuery<ProductWithOwnership[]>({
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
      toast({ title: t.purchaseSuccess, description: t.purchaseSuccessDescription });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");
  const currency = "FCFA";

  const paidProducts = (products || []).filter(p => !p.isFree);
  const filtered = paidProducts;

  const handleBuy = (product: ProductWithOwnership) => {
    if (balance < Number(product.price)) {
      const manque = (Number(product.price) - balance).toLocaleString();
      toast({
        title: t.errorOccurred,
        description: t.productNeedMore.replace("{0}", `${manque} ${currency}`),
        variant: "destructive",
      });
      return;
    }
    purchaseMutation.mutate(product.id);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f5f5f5" }}>

      {/* ── HEADER ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "16px 16px 14px" }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#000", letterSpacing: 0.5, textTransform: "uppercase" }}>
          Produits
        </p>
      </div>

      {/* ── PRODUCT LIST ── */}
      <div className="flex-1 overflow-y-auto pb-24 px-3 pt-4 space-y-3">
        {productsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: "#666", fontSize: 14 }}>Aucun produit disponible</p>
          </div>
        ) : (
          filtered.map(product => {
            const img = product.imageUrl || productImgFallback;
            const isPending = purchaseMutation.isPending && purchaseMutation.variables === product.id;
            const stock = Math.min(100, Math.max(0, Number(product.stockPercentage) || 0));
            const isSoldOut = stock >= 100;

            return (
              <div
                key={product.id}
                className="relative"
                style={{
                  background: "#ffffff",
                  borderRadius: 10,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
                  overflow: "hidden",
                }}
                data-testid={`product-card-${product.id}`}
              >
                {/* SOLD OUT stamp */}
                {isSoldOut && (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    style={{ transform: "rotate(-20deg)" }}
                  >
                    <span
                      className="font-black select-none"
                      style={{
                        fontSize: 64,
                        lineHeight: 1,
                        color: "#ff0000",
                        WebkitTextStroke: "2px #990000",
                        textShadow: "2px 2px 0 #aa0000, 4px 4px 8px rgba(0,0,0,0.5)",
                        opacity: 0.85,
                      }}
                    >
                      ÉPUISÉ
                    </span>
                  </div>
                )}

                <div style={{ padding: "14px 14px 12px" }}>
                  {/* ── Title ── */}
                  <p style={{
                    color: "#000",
                    fontWeight: 800,
                    fontSize: 15,
                    marginBottom: 10,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}>
                    {product.name}
                  </p>

                  {/* ── Separator ── */}
                  <div style={{ height: 1, background: "#e5e5e5", marginBottom: 10 }} />

                  {/* ── Info + Image row ── */}
                  <div className="flex gap-3 items-start">
                    {/* Left: info rows */}
                    <div className="flex-1">
                      <InfoRow
                        label="Prix :"
                        value={`${currency} ${Number(product.price).toLocaleString()}`}
                      />
                      <InfoRow
                        label="Durée :"
                        value={`${product.cycleDays} jours`}
                      />
                      <InfoRow
                        label="Revenu quotidien :"
                        value={`${currency} ${Number(product.dailyEarnings).toLocaleString()}`}
                      />
                      <InfoRow
                        label="Revenu total :"
                        value={`${currency} ${Number(product.totalReturn).toLocaleString()}`}
                      />
                    </div>

                    {/* Right: product image */}
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        flexShrink: 0,
                        border: "2px solid #000",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#f5f5f5",
                      }}
                    >
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* ── ACHETER button — compact, right-aligned ── */}
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => !isSoldOut && handleBuy(product)}
                      disabled={purchaseMutation.isPending || isSoldOut}
                      className="flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                      style={{
                        height: 36,
                        paddingLeft: 28,
                        paddingRight: 28,
                        borderRadius: 6,
                        background: isSoldOut ? "#aaa" : "#000",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        letterSpacing: 1.5,
                        boxShadow: isSoldOut ? "none" : "0 2px 8px rgba(0,0,0,0.35)",
                        border: "none",
                        cursor: isSoldOut ? "default" : "pointer",
                      }}
                      data-testid={`button-purchase-${product.id}`}
                    >
                      {isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : isSoldOut
                        ? "ÉPUISÉ"
                        : "ACHETER"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
