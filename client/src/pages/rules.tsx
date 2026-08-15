import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";

export default function RulesPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const signupBonus = settings?.signupBonus || "200";
  const minDeposit = settings?.minDeposit || "4000";
  const minWithdrawal = settings?.minWithdrawal || "1500";
  const withdrawalFees = settings?.withdrawalFees || "18";
  const withdrawalStartHour = settings?.withdrawalStartHour || "9";
  const withdrawalEndHour = settings?.withdrawalEndHour || "17";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const lv1 = settings?.level1Commission || "25";
  const lv2 = settings?.level2Commission || "3";
  const lv3 = settings?.level3Commission || "1";

  const rPageTitle = getContent(settings, "content_rulespage_pageTitle", "Règles de la plateforme");
  const rS1Title = getContent(settings, "content_rulespage_s1Title", "1. Investissement");
  const rS1b1 = getContent(settings, "content_rulespage_s1b1", "Chaque utilisateur peut posséder plusieurs produits d'investissement simultanément.");
  const rS1b2 = getContent(settings, "content_rulespage_s1b2", "Les revenus sont générés quotidiennement et crédités toutes les 24h après l'heure d'achat.");
  const rS1b3 = getContent(settings, "content_rulespage_s1b3", "La durée standard d'investissement est de 360 jours, sauf mention contraire sur le produit.");
  const rS2Title = getContent(settings, "content_rulespage_s2Title", "2. Recharge & Retrait");
  const rS3Title = getContent(settings, "content_rulespage_s3Title", "3. Système de parrainage");
  const rS3b4 = getContent(settings, "content_rulespage_s3b4", "Toute activité frauduleuse ou manipulation via plusieurs comptes entraînera la suspension du compte.");
  const rS4Title = getContent(settings, "content_rulespage_s4Title", "4. Bonus d'inscription");
  const rS5Title = getContent(settings, "content_rulespage_s5Title", "5. Sécurité");
  const rS5b1 = getContent(settings, "content_rulespage_s5b1", "Vous êtes responsable de la sécurité de votre mot de passe.");
  const rS5b2 = getContent(settings, "content_rulespage_s5b2", "Ne partagez jamais vos informations de connexion avec quiconque.");
  const rS5b3 = getContent(settings, "content_rulespage_s5b3", "Le support officiel ne vous demandera jamais votre mot de passe.");

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>
      <header className="flex items-center px-4 py-3 border-b bg-white">
        <Link href="/account">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-800 pr-6">{rPageTitle}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#E8192C] border-l-4 border-[#E8192C] pl-3">{rS1Title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/90 text-sm">
            <li>{rS1b1}</li>
            <li>{rS1b2}</li>
            <li>{rS1b3}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#E8192C] border-l-4 border-[#E8192C] pl-3">{rS2Title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/90 text-sm">
            <li>Montant minimum de recharge : {parseInt(minDeposit).toLocaleString()} FCFA.</li>
            <li>Montant minimum de retrait : {parseInt(minWithdrawal).toLocaleString()} FCFA.</li>
            <li>Frais de retrait : {withdrawalFees}%, couvrant les frais de traitement et de maintenance.</li>
            <li>Horaires de retrait : {withdrawalStartHour}h00 – {withdrawalEndHour}h00.</li>
            <li>Maximum {maxWithdrawalsPerDay} retrait(s) par jour et par utilisateur.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#E8192C] border-l-4 border-[#E8192C] pl-3">{rS3Title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/90 text-sm">
            <li>Commission niveau 1 : {lv1}% sur le premier investissement du filleul direct.</li>
            <li>Commission niveau 2 : {lv2}% sur le premier investissement du filleul indirect.</li>
            <li>Commission niveau 3 : {lv3}% sur le premier investissement du filleul de niveau 3.</li>
            <li>{rS3b4}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#E8192C] border-l-4 border-[#E8192C] pl-3">{rS4Title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/90 text-sm">
            <li>Chaque nouveau membre reçoit un bonus de {parseInt(signupBonus).toLocaleString()} FCFA à l'inscription.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#E8192C] border-l-4 border-[#E8192C] pl-3">{rS5Title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/90 text-sm">
            <li>{rS5b1}</li>
            <li>{rS5b2}</li>
            <li>{rS5b3}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
