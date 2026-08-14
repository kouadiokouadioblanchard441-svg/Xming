import { Switch, Route, useLocation, Redirect, Router } from "wouter";
import { useState, useEffect, useCallback } from "react";

// Hash location hook — returns ONLY the path (strips query string) so
// regexparam route matching works correctly with URLs like /#/register?invite_code=XYZ
function useHashPath(_opts?: object): [string, (to: string, opts?: object) => void] {
  const getPath = () => {
    const hash = window.location.hash.replace(/^#?\/?/, "");
    return "/" + (hash.split("?")[0] || "");
  };
  const [loc, setLoc] = useState(getPath);
  useEffect(() => {
    const handler = () => setLoc(getPath());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const navigate = useCallback((to: string, opts?: any) => {
    const method = opts?.replace ? "replaceState" : "pushState";
    history[method](opts?.state ?? null, "", location.pathname + "#/" + to.replace(/^\//, ""));
    window.dispatchEvent(new Event("hashchange"));
  }, []);
  return [loc, navigate];
}
// Expose hrefs formatter so <Link> and <Redirect> generate correct hash hrefs
(useHashPath as any).hrefs = (href: string) => "#/" + href.replace(/^\//, "");

// Search hook — reads query string from the hash (e.g. #/register?invite_code=XYZ → ?invite_code=XYZ)
function useHashSearch(_opts?: object): string {
  const getSearch = () => {
    const hash = window.location.hash;
    const q = hash.indexOf("?");
    return q >= 0 ? hash.slice(q) : "";
  };
  const [search, setSearch] = useState(getSearch);
  useEffect(() => {
    const handler = () => setSearch(getSearch());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return search;
}
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import BottomNav from "@/components/bottom-nav";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HomePage from "@/pages/home";
import TasksPage from "@/pages/tasks";
import InvestPage from "@/pages/invest";
import ProductsPage from "@/pages/products";
import OrdersPage from "@/pages/orders";
import TeamPage from "@/pages/team";
import AccountPage from "@/pages/account";
import AdminPage from "@/pages/admin";
import AdminTeamPage from "@/pages/admin-team";
import BankerPage from "@/pages/banker";
import DepositPage from "@/pages/deposit";
import WithdrawalPage from "@/pages/withdrawal";
import DepositHistoryPage from "@/pages/deposit-history";
import DepositsHistoryPage from "@/pages/deposit-history-real";
import HistoryPage from "@/pages/history";
import ServicePage from "@/pages/service";
import WalletPage from "@/pages/wallet";
import ChangePasswordPage from "@/pages/change-password";
import AboutPage from "@/pages/about";
import CompanyPage from "@/pages/company";
import RulesPage from "@/pages/rules";
import GiftCodePage from "@/pages/gift-code";
import TeamDetailsPage from "@/pages/team-details";
import MembersPage from "@/pages/members";
import MyProductsPage from "@/pages/my-products";
import CheckinPage from "@/pages/checkin";
import RewardsPage from "@/pages/rewards";
import WithdrawalHistoryPage from "@/pages/withdrawal-history";
import ExpiredProductsPage from "@/pages/expired-products";
import DepositOrdersPage from "@/pages/deposit-orders";
import DepositCallbackPage from "@/pages/deposit-callback";
import SalaryBonusPage from "@/pages/salary-bonus";
import NewsDetailPage from "@/pages/news-detail";
import SpinWheelPage from "@/pages/spin-wheel";
import VipPage from "@/pages/vip";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import NavigationLoader from "@/components/navigation-loader";

function BannedMessage() {
  const { t } = useI18n();
  return (
    <>
      <h1 className="text-2xl font-bold text-destructive mb-2">{t.accountSuspended}</h1>
      <p className="text-muted-foreground">{t.accountSuspendedDesc}</p>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <BannedMessage />
        </div>
      </div>
    );
  }

  if ((user as any).isBanker && !user.isAdmin && location !== "/banker") {
    return <Redirect to="/banker" />;
  }

  return <>{children}</>;
}

function BankerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (!(user as any).isBanker && !user.isAdmin) return <Redirect to="/" />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-16">
      {children}
      <BottomNav />
    </div>
  );
}

function RouterComponent() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      </Route>
      <Route path="/register">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>
      <Route path="/invitation">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>
      <Route path="/rejoindre">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <HomePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/tasks">
        <ProtectedRoute>
          <AppLayout>
            <TasksPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/invest">
        <ProtectedRoute>
          <AppLayout>
            <ProductsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute>
          <AppLayout>
            <OrdersPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/team">
        <ProtectedRoute>
          <AppLayout>
            <TeamPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/my-products">
        <ProtectedRoute>
          <AppLayout>
            <MyProductsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/checkin">
        <ProtectedRoute>
          <AppLayout>
            <CheckinPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/account">
        <ProtectedRoute>
          <AppLayout>
            <AccountPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deposit">
        <ProtectedRoute>
          <DepositPage />
        </ProtectedRoute>
      </Route>
      <Route path="/withdrawal">
        <ProtectedRoute>
          <WithdrawalPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-history">
        <ProtectedRoute>
          <DepositHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposits-history">
        <ProtectedRoute>
          <DepositsHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/withdrawal-history">
        <ProtectedRoute>
          <WithdrawalHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/expired-products">
        <ProtectedRoute>
          <ExpiredProductsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-orders">
        <ProtectedRoute>
          <DepositOrdersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-callback/:id">
        <ProtectedRoute>
          <DepositCallbackPage />
        </ProtectedRoute>
      </Route>
      <Route path="/service">
        <ProtectedRoute>
          <ServicePage />
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute>
          <WalletPage />
        </ProtectedRoute>
      </Route>
      <Route path="/change-password">
        <ProtectedRoute>
          <ChangePasswordPage />
        </ProtectedRoute>
      </Route>
      <Route path="/about">
        <ProtectedRoute>
          <AboutPage />
        </ProtectedRoute>
      </Route>
      <Route path="/company">
        <ProtectedRoute>
          <CompanyPage />
        </ProtectedRoute>
      </Route>
      <Route path="/rules">
        <ProtectedRoute>
          <RulesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/gift-code">
        <ProtectedRoute>
          <GiftCodePage />
        </ProtectedRoute>
      </Route>
      <Route path="/team-details">
        <ProtectedRoute>
          <TeamDetailsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/members">
        <ProtectedRoute>
          <MembersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/daily-bonus">
        <ProtectedRoute>
          <AppLayout>
            <RewardsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/salary-bonus">
        <ProtectedRoute>
          <AppLayout>
            <SalaryBonusPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/spin-wheel">
        <ProtectedRoute>
          <SpinWheelPage />
        </ProtectedRoute>
      </Route>
      <Route path="/vip">
        <ProtectedRoute>
          <VipPage />
        </ProtectedRoute>
      </Route>
      <Route path="/news/:id">
        <ProtectedRoute>
          <AppLayout>
            <NewsDetailPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      </Route>
      <Route path="/admin/team/:id">
        <AdminRoute>
          <AdminTeamPage />
        </AdminRoute>
      </Route>
      <Route path="/banker">
        <BankerRoute>
          <BankerPage />
        </BankerRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router hook={useHashPath} searchHook={useHashSearch}>
              <RouterComponent />
            </Router>
            <NavigationLoader />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
