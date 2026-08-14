import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";

export default function AboutPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const pageTitle = getContent(settings, "content_about_pageTitle", "À propos");
  const s1Title   = getContent(settings, "content_about_s1Title",   "Qui sommes-nous ?");
  const s1Text1   = getContent(settings, "content_about_s1Text1",   "XPENG est une entreprise technologique innovante qui développe des solutions de mobilité et des services numériques.");
  const s1Text2   = getContent(settings, "content_about_s1Text2",   "Notre plateforme d'investissement vous permet de faire fructifier votre capital grâce à des produits performants et une gestion transparente.");
  const s2Title   = getContent(settings, "content_about_s2Title",   "Nos produits & solutions");
  const s2Text    = getContent(settings, "content_about_s2Text",    "La plateforme propose une gamme de produits d'investissement allant de l'entrée de gamme au premium, avec des rendements journaliers adaptés à chaque profil.");
  const s3Title   = getContent(settings, "content_about_s3Title",   "Notre modèle");
  const s3Text    = getContent(settings, "content_about_s3Text",    "Chaque membre peut acheter un ou plusieurs produits, générer des revenus quotidiens et retirer ses gains en FCFA via Mobile Money.");
  const s4Title   = getContent(settings, "content_about_s4Title",   "Qualité & engagement");
  const s4Text    = getContent(settings, "content_about_s4Text",    "Nous nous engageons à offrir une plateforme fiable, sécurisée et transparente, avec un support disponible 7j/7 pour accompagner chaque investisseur.");

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>
      <header className="flex items-center px-4 py-3 border-b" style={{ background: "#1e2e0a" }}>
        <Link href="/account">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-white pr-6">{pageTitle}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">{s1Title}</h2>
          <p className="text-white/80 leading-relaxed">{s1Text1}</p>
          <p className="text-white/80 leading-relaxed">{s1Text2}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">{s2Title}</h2>
          <p className="text-white/80 leading-relaxed">{s2Text}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">{s3Title}</h2>
          <p className="text-white/80 leading-relaxed">{s3Text}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">{s4Title}</h2>
          <p className="text-white/80 leading-relaxed">{s4Text}</p>
        </div>
      </div>
    </div>
  );
}
