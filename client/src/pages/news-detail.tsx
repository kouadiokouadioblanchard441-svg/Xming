import { useLocation, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const NEWS_ARTICLES = [
  {
    id: "1",
    title: "Asus : une expertise technologique depuis 1989",
    summary: "Fondée en 1989, Asus est aujourd'hui l'un des leaders mondiaux de la technologie, reconnu pour l'innovation et la qualité de ses produits.",
    body: `Asus a été fondée en 1989 à Taïpei, Taïwan, par quatre anciens ingénieurs d'Acer.

Dès ses débuts, l'entreprise s'est démarquée par la fabrication de cartes mères de haute qualité, avant de s'étendre aux ordinateurs portables, smartphones, écrans et solutions réseau.

Aujourd'hui, Asus est présent dans plus de 50 pays et emploie plus de 17 000 personnes dans le monde.

Notre plateforme s'appuie sur la force de la marque Asus pour offrir des opportunités d'investissement fiables et accessibles à tous.`,
    image: "",
    date: "Source officielle",
  },
  {
    id: "2",
    title: "Les produits d'investissement Asus",
    summary: "La plateforme propose une gamme complète de produits d'investissement avec des rendements journaliers attractifs.",
    body: `La plateforme Asus propose plusieurs niveaux de produits adaptés à chaque investisseur :

- VIP 1 à VIP 3 : produits d'entrée de gamme, accessibles dès 600 FCFA
- VIP 4 à VIP 6 : produits intermédiaires avec des rendements élevés
- VIP 7 à VIP 9 : produits premium pour les investisseurs confirmés

Chaque produit génère des revenus journaliers versés directement sur votre solde.

Les gains peuvent être retirés via Mobile Money après validation par notre équipe.`,
    image: "",
    date: "Produits officiels",
  },
  {
    id: "3",
    title: "Qualité, transparence et service",
    summary: "Asus s'engage pour la transparence, la sécurité et la satisfaction de chaque membre de la plateforme.",
    body: `La plateforme Asus repose sur trois piliers fondamentaux :

1. **Transparence** — Tous les montants, frais et conditions sont clairement affichés avant toute transaction.

2. **Sécurité** — Vos données personnelles et financières sont protégées par des systèmes de sécurité avancés.

3. **Support** — Notre équipe est disponible 7j/7 pour répondre à toutes vos questions et vous accompagner.

Rejoignez des milliers de membres qui font confiance à Asus pour faire fructifier leur capital.`,
    image: "",
    date: "Qualité & service",
  },
];

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const article = NEWS_ARTICLES.find((a) => a.id === params.id);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#000000" }}>
        <p className="text-white/60">Article introuvable</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>
      <header className="flex items-center px-4 py-3" style={{ background: "#1e2e0a" }}>
        <button onClick={() => navigate("/service")} className="p-1" data-testid="button-back">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-white pr-8 line-clamp-1">
          {article.title}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        {article.image && (
          <img src={article.image} alt={article.title} className="w-full object-cover" style={{ maxHeight: 220 }} />
        )}
        <div className="p-5 space-y-4">
          <p className="text-white/50 text-xs">{article.date}</p>
          <h2 className="text-white font-bold text-lg leading-snug">{article.title}</h2>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{article.body}</p>
        </div>
      </div>
    </div>
  );
}
