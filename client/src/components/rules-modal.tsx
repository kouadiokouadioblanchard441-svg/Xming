import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RulesModal({ open, onClose }: RulesModalProps) {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const minDeposit = settings?.minDeposit || "20000";
  const minWithdrawal = settings?.minWithdrawal || "5000";
  const withdrawalFees = settings?.withdrawalFees || "15";
  const withdrawalStartHour = settings?.withdrawalStartHour || "8";
  const withdrawalEndHour = settings?.withdrawalEndHour || "18";
  const withdrawalMinDelayMinutes = settings?.withdrawalMinDelayMinutes || "30";
  const withdrawalMaxDelayHours = settings?.withdrawalMaxDelayHours || "6";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const lv1 = settings?.level1Commission || "10";
  const lv2 = settings?.level2Commission || "2";
  const lv3 = settings?.level3Commission || "1";

  const title = getContent(settings, "content_rules_title", "Règles de la plateforme");
  const s1Title = getContent(settings, "content_rules_section1Title", "1. Dépôts");
  const s1Body = getContent(settings, "content_rules_section1Body", `- Montant minimum : ${parseInt(minDeposit).toLocaleString()} CDF\n- Vérifiez l'opérateur et le numéro Mobile Money avant de confirmer`);
  const s2Title = getContent(settings, "content_rules_section2Title", "2. Retraits");
  const s2Body = getContent(settings, "content_rules_section2Body", `- Montant minimum : ${parseInt(minWithdrawal).toLocaleString()} CDF\n- Frais de retrait : ${withdrawalFees}%\n- Horaires : tous les jours de ${withdrawalStartHour}h à ${withdrawalEndHour}h (heure locale de Kinshasa)\n- Délai de traitement : ${withdrawalMinDelayMinutes} minutes à ${withdrawalMaxDelayHours} heures\n- Maximum ${maxWithdrawalsPerDay} retrait(s) par jour\n- Un produit actif et un portefeuille Mobile Money enregistré sont requis`);
  const s3Title = getContent(settings, "content_rules_section3Title", "3. Produits");
  const s3Body = getContent(settings, "content_rules_section3Body", "- Cycle VIP : 30 jours\n- Revenus quotidiens\n- Revenus crédités toutes les 24 heures après l'achat");
  const s4Title = getContent(settings, "content_rules_section4Title", "4. Parrainage");
  const s4Body = getContent(settings, "content_rules_section4Body", `- Niveau 1 : ${lv1}% de commission\n- Niveau 2 : ${lv2}% de commission\n- Niveau 3 : ${lv3}% de commission\n- Commissions sur les achats de produits`);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <section>
              <h4 className="font-medium text-foreground mb-2">{s1Title}</h4>
              <ul className="space-y-1">
                {s1Body.split("\n").map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">{s2Title}</h4>
              <ul className="space-y-1">
                {s2Body.split("\n").map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">{s3Title}</h4>
              <ul className="space-y-1">
                {s3Body.split("\n").map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">{s4Title}</h4>
              <ul className="space-y-1">
                {s4Body.split("\n").map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
