import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { FALLBACK_COUNTRIES, type ApiCountry } from "@/lib/countries";
import { CountrySelector } from "@/components/country-selector";
import { useI18n } from "@/lib/i18n";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { LockBoldIcon, PhoneBoldIcon } from "@/components/auth-icons";
import { FloatingSupport } from "@/components/floating-support";
import { setAppLoading } from "@/components/navigation-loader";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = z.object({
    phone: z.string().min(8, t.errInvalidPhone),
    country: z.string().min(2, t.selectCountry),
    password: z.string().min(1, t.errPasswordRequired),
  });
  type LoginForm = z.infer<typeof loginSchema>;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      country: "CI",
      password: "",
    },
  });

  const { data: apiCountries } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });

  const selectedCountry = form.watch("country");

  useEffect(() => {
    if (!apiCountries || apiCountries.length === 0) return;
  }, [apiCountries, selectedCountry, form]);

  const countryData = (() => {
    if (apiCountries && apiCountries.length > 0) {
      const c = apiCountries.find(ac => ac.code === selectedCountry && ac.isActive);
      if (c) return { phonePrefix: c.phonePrefix, name: c.name };
    }
    const f = FALLBACK_COUNTRIES.find(fc => fc.code === selectedCountry);
    return f ? { phonePrefix: f.phonePrefix, name: f.name } : null;
  })();

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setAppLoading(true);
    try {
      await login(data.phone, data.country, data.password);
      navigate("/");
    } catch (error: any) {
      toast({ title: error.message || t.errLoginFailed, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setAppLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 10,
    border: "none",
    height: 54,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(to bottom, #000000 0%, #1a1a1a 30%, #4a4a4a 60%, #c0c0c0 85%, #f5f5f5 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: "24px 16px",
        }}
      >
        <div className="w-full flex flex-col gap-4" style={{ maxWidth: 480 }}>

          {/* Logo */}
          <div className="flex items-center justify-center" style={{ paddingBottom: 48, paddingTop: 16 }}>
            <img
              src="/xpeng-logo-white.svg"
              alt="XPENG"
              style={{ height: 36, objectFit: "contain" }}
            />
          </div>

          <input type="hidden" {...form.register("country")} />

          {/* Phone */}
          <div style={inputStyle}>
            <div className="pl-4 pr-2 flex items-center shrink-0">
              <PhoneBoldIcon size={22} color="#9ca3af" />
            </div>
            <button
              type="button"
              onClick={() => setCountryModalOpen(true)}
              className="flex items-center gap-1 pr-3 h-full font-bold text-sm shrink-0 border-r"
              style={{ color: "#333", borderColor: "rgba(0,0,0,0.15)" }}
              data-testid="button-select-country"
            >
              +{countryData?.phonePrefix || "225"}
              <ChevronDown size={13} />
            </button>
            <input
              {...form.register("phone")}
              type="tel"
              placeholder={t.phonePlaceholder}
              className="flex-1 h-full bg-transparent text-gray-700 placeholder:text-gray-400 text-sm outline-none px-3"
              data-testid="input-phone"
            />
          </div>
          {form.formState.errors.phone && (
            <p className="text-red-600 text-xs -mt-2 ml-1">{form.formState.errors.phone.message}</p>
          )}

          {/* Password */}
          <div style={inputStyle}>
            <div className="pl-4 pr-3 flex items-center shrink-0">
              <LockBoldIcon size={22} color="#9ca3af" />
            </div>
            <input
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              placeholder={t.passwordPlaceholder}
              className="flex-1 h-full bg-transparent text-gray-700 placeholder:text-gray-400 text-sm outline-none"
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="pr-4 pl-2 flex items-center shrink-0"
            >
              {showPassword
                ? <EyeOff size={18} className="text-gray-400" />
                : <Eye size={18} className="text-gray-400" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-red-600 text-xs -mt-2 ml-1">{form.formState.errors.password.message}</p>
          )}

          {/* Login button */}
          <button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="w-full font-bold text-white text-base disabled:opacity-50 transition-all active:scale-95"
            style={{
              height: 56,
              borderRadius: 10,
              background: "#000000",
              boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
              marginTop: 8,
            }}
            data-testid="button-login"
          >
            {t.loginImmediately}
          </button>

          {/* Link to register */}
          <div className="flex items-center justify-center" style={{ paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm font-medium underline transition-opacity active:opacity-70"
              style={{ color: "#111111" }}
              data-testid="link-register"
            >
              Aller à l'inscription &gt;
            </button>
          </div>

        </div>
      </div>

      <CountrySelector
        open={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={(code) => form.setValue("country", code, { shouldValidate: true })}
        selectedCode={selectedCountry}
        apiCountries={apiCountries}
      />
      <FloatingSupport bottomOffset={24} />
    </div>
  );
}
