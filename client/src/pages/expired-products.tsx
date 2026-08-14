import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, PackageX } from "lucide-react";
import { Link } from "wouter";

interface UserProduct {
  id: number;
  productId: number;
  purchasedAt: string;
  daysRemaining: number;
  totalEarned: string;
  status: string;
  product: {
    id: number;
    name: string;
    price: string;
    dailyEarnings: string;
    cycleDays: number;
    totalReturn: string;
    imageUrl?: string;
  };
}

const CURRENCY = "FCFA";

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExpiredProductsPage() {
  const { user } = useAuth();

  const { data: allProducts = [], isLoading } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  if (!user) return null;

  const expired = allProducts.filter(p => p.status === "completed" || p.daysRemaining <= 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>

      {/* ── Header ── */}
      <div className="flex items-center px-3 pt-4 pb-3">
        <Link href="/my-products">
          <button className="p-2 bg-white/20 rounded-full" data-testid="button-back">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </Link>
        <p className="text-white text-lg font-black tracking-tight ml-3">Produits expirés</p>
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 px-3 pb-20 space-y-3 mt-1">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : expired.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <PackageX className="w-16 h-16 text-white/30" />
            <p className="text-white/60 font-semibold text-sm">Aucun produit expiré</p>
          </div>
        ) : (
          expired.map((up) => {
            const cycleDays = up.product?.cycleDays || 0;
            const totalEarned = parseFloat(up.totalEarned || "0");
            const totalReturn = parseFloat(up.product?.totalReturn || "0");
            const price = parseFloat(up.product?.price || "0");

            return (
              <div
                key={up.id}
                className="rounded-2xl overflow-hidden shadow-lg relative"
                style={{ background: "#000000", opacity: 0.9 }}
              >
                {/* ── Tampon FAKE 3D ── */}
                <div
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                  style={{ transform: "rotate(-20deg)" }}
                >
                  <span
                    className="font-black select-none"
                    style={{
                      fontSize: 72,
                      lineHeight: 1,
                      color: "#ff0000",
                      letterSpacing: "0.05em",
                      textShadow: "2px 2px 0 #aa0000, 4px 4px 0 #cc0000, 6px 6px 0 #dd0000, 8px 8px 14px rgba(0,0,0,0.7)",
                      WebkitTextStroke: "2px #990000",
                      opacity: 0.9,
                    }}
                  >
                    FAKE
                  </span>
                </div>

                {/* Header carte */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  <p className="text-white font-bold text-sm">{up.product?.name}</p>
                  <span
                    className="text-xs font-bold px-3 py-0.5 rounded-full"
                    style={{ background: "#dc2626", color: "white" }}
                  >
                    Expiré
                  </span>
                </div>

                {/* Corps */}
                <div className="flex gap-3 px-4 py-3">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={up.product?.imageUrl || "/powerbank-1.jpg"}
                      alt={up.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white/70 text-xs">Prix d'achat</span>
                      <span className="text-white font-bold text-xs">{CURRENCY} {price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-xs">Gains/jour</span>
                      <span className="text-white font-bold text-xs">
                        {CURRENCY} {parseFloat(up.product?.dailyEarnings || "0").toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-xs">Total encaissé</span>
                      <span className="text-white font-bold text-xs">{CURRENCY} {totalEarned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-xs">Durée</span>
                      <span className="text-white font-bold text-xs">{cycleDays} jours</span>
                    </div>
                  </div>
                </div>

                {/* Pied */}
                <div
                  className="px-4 py-2 flex justify-between items-center"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <span className="text-white/60 text-xs">Acheté le {formatDate(up.purchasedAt)}</span>
                  <span className="text-white/60 text-xs">Terminé</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
