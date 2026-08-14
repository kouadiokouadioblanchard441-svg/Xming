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

  const minDeposit = settings?.minDeposit || "4000";
  const minWithdrawal = settings?.minWithdrawal || "1500";
  const withdrawalFees = settings?.withdrawalFees || "18";
  const withdrawalStartHour = settings?.withdrawalStartHour || "9";
  const withdrawalEndHour = settings?.withdrawalEndHour || "17";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const lv1 = settings?.level1Commission || "15";
  const lv2 = settings?.level2Commission || "2";
  const lv3 = settings?.level3Commission || "1";

  const title = getContent(settings, "content_rules_title", "Platform Rules");
  const s1Title = getContent(settings, "content_rules_section1Title", "1. Deposits");
  const s1Body = getContent(settings, "content_rules_section1Body", `- Minimum amount: ${parseInt(minDeposit).toLocaleString()} USDT\n- Deposits are processed promptly\n- Make sure payment information is correct`);
  const s2Title = getContent(settings, "content_rules_section2Title", "2. Withdrawals");
  const s2Body = getContent(settings, "content_rules_section2Body", `- Minimum amount: ${parseInt(minWithdrawal).toLocaleString()} USDT\n- Withdrawal fee: ${withdrawalFees}%\n- Hours: ${withdrawalStartHour}h - ${withdrawalEndHour}h\n- Maximum ${maxWithdrawalsPerDay} withdrawal(s) per day\n- An active product is required to withdraw\n- A withdrawal wallet must be registered`);
  const s3Title = getContent(settings, "content_rules_section3Title", "3. Products");
  const s3Body = getContent(settings, "content_rules_section3Body", "- Standard cycle: 80 days\n- Daily automatic earnings\n- Earnings are credited 24h after purchase");
  const s4Title = getContent(settings, "content_rules_section4Title", "4. Referral");
  const s4Body = getContent(settings, "content_rules_section4Body", `- Level 1: ${lv1}% commission\n- Level 2: ${lv2}% commission\n- Level 3: ${lv3}% commission\n- Commissions on product purchases`);

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
