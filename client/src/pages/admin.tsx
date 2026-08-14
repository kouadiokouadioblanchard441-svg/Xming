import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AdminDashboard from "@/components/admin/dashboard";
import AdminDeposits from "@/components/admin/deposits";
import AdminWithdrawals from "@/components/admin/withdrawals";
import AdminUsers from "@/components/admin/users";
import AdminProducts from "@/components/admin/products";
import AdminPaymentNumbers from "@/components/admin/payment-numbers";
import AdminSettings from "@/components/admin/settings";
import AdminGiftCodes from "@/components/admin/gift-codes";
import AdminCountries from "@/components/admin/countries";
import AdminContent from "@/components/admin/content";
import AdminCompanyContent from "@/components/admin/company-content";
import AdminWheel from "@/components/admin/wheel";
import AdminVipSettings from "@/components/admin/vip-settings";
import AdminDepositChannels from "@/components/admin/deposit-channels";
import AdminSpinWheelConfig from "@/components/admin/spin-wheel-config";
import AdminBannerConfig from "@/components/admin/banner-config";

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary px-4 py-4 flex items-center gap-4 sticky top-0 z-50">
        <Button size="icon" variant="ghost" onClick={() => navigate("/account")} data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-secondary-foreground" data-testid="text-admin-title">{t.adminPanel}</h1>
      </header>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="w-max">
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">{t.adminTabDashboard}</TabsTrigger>
              <TabsTrigger value="deposits" data-testid="tab-deposits">{t.adminTabDeposits}</TabsTrigger>
              <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">{t.adminTabWithdrawals}</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">{t.adminTabUsers}</TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">{t.adminTabProducts}</TabsTrigger>

              <TabsTrigger value="spin-wheel" data-testid="tab-spin-wheel">🎡 Roue</TabsTrigger>
              <TabsTrigger value="deposit-channels" data-testid="tab-deposit-channels">Canaux dépôt</TabsTrigger>
              <TabsTrigger value="payment-numbers" data-testid="tab-payment-numbers">{t.adminTabNumbers}</TabsTrigger>
              <TabsTrigger value="countries" data-testid="tab-countries">{t.adminTabCountries}</TabsTrigger>
              <TabsTrigger value="giftcodes" data-testid="tab-giftcodes">{t.adminTabGiftCodes}</TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">{t.adminTabSettings}</TabsTrigger>
              <TabsTrigger value="wheel" data-testid="tab-wheel">{t.adminTabWheel}</TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content">{t.adminTabContent}</TabsTrigger>
              <TabsTrigger value="company" data-testid="tab-company">{t.adminTabCompany}</TabsTrigger>
              <TabsTrigger value="banners" data-testid="tab-banners">🖼 Bannières</TabsTrigger>
              <TabsTrigger value="vip" data-testid="tab-vip">⭐ VIP</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-4">
            <AdminDashboard isSuperAdmin={user.isSuperAdmin} />
          </TabsContent>

          <TabsContent value="deposits" className="mt-4">
            <AdminDeposits />
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4">
            <AdminWithdrawals />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <AdminUsers isSuperAdmin={user.isSuperAdmin} />
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <AdminProducts />
          </TabsContent>


          <TabsContent value="spin-wheel" className="mt-4">
            <AdminSpinWheelConfig />
          </TabsContent>

          <TabsContent value="deposit-channels" className="mt-4">
            <AdminDepositChannels />
          </TabsContent>

          <TabsContent value="payment-numbers" className="mt-4">
            <AdminPaymentNumbers />
          </TabsContent>

          <TabsContent value="countries" className="mt-4">
            <AdminCountries />
          </TabsContent>

          <TabsContent value="giftcodes" className="mt-4">
            <AdminGiftCodes />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <AdminSettings isSuperAdmin={user.isSuperAdmin} />
          </TabsContent>

          <TabsContent value="wheel" className="mt-4">
            <AdminWheel />
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <AdminContent />
          </TabsContent>

          <TabsContent value="company" className="mt-4">
            <AdminCompanyContent />
          </TabsContent>

          <TabsContent value="banners" className="mt-4">
            <AdminBannerConfig />
          </TabsContent>

          <TabsContent value="vip" className="mt-4">
            <AdminVipSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
