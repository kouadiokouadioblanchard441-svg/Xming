import { Building2, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import type { CompanyContent } from "@shared/schema";

export default function CompanyPage() {
  const { t } = useI18n();
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const { data: blocks, isLoading } = useQuery<CompanyContent[]>({
    queryKey: ["/api/company-content"],
  });

  const pageTitle = getContent(settings, "content_company_pageTitle", "Entreprise");
  const intro = getContent(
    settings,
    "content_company_intro",
    "Découvrez notre entreprise, nos plans d'investissement et les informations importantes sur la plateforme.",
  );
  const legacyBlocks: Record<string, { title: string; body: string }> = {
    "Qui sommes-nous ?": { title: "Qui sommes-nous ?", body: "Découvrez notre entreprise, notre vision et les solutions que nous proposons à nos membres." },
    "Nos plans d'investissement": { title: "Nos plans d'investissement", body: "Retrouvez ici les détails sur nos plans d'investissement, les conditions associées et les opportunités offertes par la plateforme." },
    "Notre engagement": { title: "Notre engagement", body: "Nous valorisons la transparence, la qualité de service et apportons un soutien à chaque membre." },
  };

  return (
    <div className="min-h-screen pb-6" style={{ background: "#000000" }}>
      <header className="flex items-center px-4 py-3" style={{ background: "#1e2e0a" }}>
        <Link href="/">
          <button className="p-1" data-testid="button-company-back" aria-label="Retour">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-white pr-8">{pageTitle}</h1>
      </header>

      <main className="p-4 space-y-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#000000" }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{pageTitle}</h2>
          </div>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{intro}</p>
        </section>

        {isLoading ? (
          <div className="rounded-2xl bg-white/70 h-32 animate-pulse" />
        ) : blocks && blocks.length > 0 ? (
            blocks.map((block) => {
              const translated = legacyBlocks[block.title];
              const title = translated?.title || block.title || "Information";
              const body = translated?.body || block.body || "Plus d'informations bientôt disponibles.";
              return (
            <article key={block.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {block.imageUrl && (
                <img
                  src={block.imageUrl}
                   alt={title}
                  className="w-full max-h-64 object-cover"
                />
              )}
              <div className="p-5">
                <h2 className="text-lg font-bold mb-2" style={{ color: "#E8192C" }}>{title}</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{body}</p>
              </div>
            </article>
              );
            })
        ) : (
          <section className="rounded-2xl bg-white p-8 text-center text-gray-500">
            <ImageIcon className="mx-auto mb-2 w-8 h-8 text-gray-300" />
            {t.comingSoon}
          </section>
        )}
      </main>
    </div>
  );
}