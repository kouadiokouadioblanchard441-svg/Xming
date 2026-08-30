import { useState } from "react";
import { useAuth } from "@/lib/auth";
import landscapeImg from "@assets/portable-charger-power-banks_480x480_d6b67d82-6118-4295-be02-e_1784966597898.jpg";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

import elfExpert1 from "@/assets/images/elf-expert-1.jpeg";
import elfExpert2 from "@/assets/images/elf-expert-2.webp";
import elfStation1 from "@/assets/images/elf-station-1.jpg";
import elfStation2 from "@/assets/images/elf-station-2.jpeg";

const productImages = [elfExpert1, elfExpert2, elfStation1, elfStation2];

export default function OrdersPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const { data: userProducts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  if (!user) return null;

  const headerTitle = getContent(settings, "content_orders_headerTitle", t.myProductsTitle);
  const infoLine1 = getContent(settings, "content_orders_infoLine1", t.myProductsSettledEvery24h);
  const infoLine2 = getContent(settings, "content_orders_infoLine2", t.purchaseSuccessDescription);

  const getProductImage = (index: number) => {
    return productImages[index % productImages.length];
  };

  const filteredProducts = userProducts?.filter((up: any) =>
    activeTab === "active" ? up.status === "active" : up.status !== "active"
  ) || [];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0d0d" }}>
      <header className="px-4 py-3 border-b border-white/20">
        <h1 className="text-lg font-semibold text-white text-center">{headerTitle}</h1>
      </header>

      <div className="flex border-b border-white/20">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "text-white border-b-2 border-white"
              : "text-white/50"
          }`}
          data-testid="orders-tab-active"
        >
          <span className="w-2 h-2 rounded-full bg-white"></span>
          {t.ordersOngoing}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === "completed"
              ? "text-white border-b-2 border-white"
              : "text-white/50"
          }`}
          data-testid="orders-tab-completed"
        >
          <span className={activeTab === "completed" ? "text-white" : "text-white/50"}>&#10003;</span>
          {t.ordersCompleted}
        </button>
      </div>

      <div className="bg-gray-50 p-3 mx-4 mt-3 rounded-lg">
        <p className="text-xs text-gray-700 leading-relaxed">{infoLine1}</p>
        <p className="text-xs text-gray-700 leading-relaxed mt-1">{infoLine2}</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map((up: any, index: number) => {
              const daysCompleted = (up.product?.cycleDays || 0) - (up.daysRemaining || 0);
              const totalEarned = daysCompleted * Number(up.product?.dailyEarnings || 0);
              const purchaseDateTime = up.purchasedAt ? new Date(up.purchasedAt) : null;
              const purchaseDate = purchaseDateTime ? purchaseDateTime.toLocaleDateString() : '-';
              const purchaseTime = purchaseDateTime ? purchaseDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-';

              return (
                <div
                  key={up.id}
                  className="bg-white rounded-xl p-2 shadow-sm border"
                  data-testid={`order-card-${up.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={getProductImage(up.productId ? up.productId % productImages.length : index)}
                        alt={up.product?.name || t.noProducts}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-red-500 font-bold text-xs">
                          {up.product?.name || t.noProducts}
                        </p>
                        <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          up.status === 'active'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {up.status === 'active' ? t.ordersStatusActive : t.ordersStatusDone}
                        </span>
                      </div>

                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-gray-600">
                          {t.price}：<span className="text-gray-800 font-medium">{Number(up.product?.price || 0).toLocaleString() || 0} FCFA</span>
                        </p>
                        <p className="text-gray-600">
                          {t.ordersDailyLbl}：<span className="text-gray-800 font-medium">{Number(up.product?.dailyEarnings || 0).toLocaleString() || 0} FCFA</span>
                        </p>
                        <p className="text-gray-600">
                          {t.ordersCycleLbl}：<span className="text-gray-800 font-medium">{up.product?.cycleDays || 0} {t.ordersDaysLbl}</span>
                        </p>
                        <p className="text-gray-600">
                          {t.ordersRemainingLbl}：<span className="text-[#2196F3] font-medium">{up.daysRemaining || 0}</span>
                        </p>
                        <p className="text-gray-600">
                          {t.ordersTotalEarnedLbl}：<span className="text-gray-600 font-bold">{totalEarned.toLocaleString()} FCFA</span>
                        </p>
                        <p className="text-gray-600">
                          {t.ordersDateLbl}：<span className="text-gray-700 font-medium">{purchaseDate}</span> {purchaseTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-4 opacity-50">
              <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
                <ellipse cx="50" cy="85" rx="35" ry="8" fill="currentColor" opacity="0.3"/>
                <circle cx="50" cy="45" r="25" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path d="M50 25 L50 20 M50 65 L50 70" stroke="currentColor" strokeWidth="3"/>
                <circle cx="50" cy="45" r="8" fill="currentColor"/>
                <path d="M30 75 L70 75 L75 85 L25 85 Z" fill="currentColor" opacity="0.5"/>
                <path d="M45 30 Q50 15 55 30" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium">{t.ordersNone}</p>
          </div>
        )}
      </div>
      <img src={landscapeImg} alt="XPENG" className="w-full object-cover object-top" style={{ maxHeight: 220 }} />
    </div>
  );
}
