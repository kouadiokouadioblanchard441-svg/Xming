import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";
import { DEFAULT_VIP_CONFIGS } from "@/lib/vip";

export default function AdminVipSettings() {
  const { toast } = useToast();
  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const val = (key: string, fallback: string) =>
    form[key] !== undefined ? form[key] : (settings[key] ?? fallback);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/settings", form);
      if (!res.ok) throw new Error("Erreur serveur");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setForm({});
      toast({ title: "✅ Paramètres VIP sauvegardés" });
    },
    onError: (e: any) => {
      toast({ title: e.message || "Erreur", variant: "destructive" });
    },
  });

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold">⭐ Configuration des niveaux VIP</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tous les seuils, récompenses et textes sont modifiables ici. Les changements s'appliquent immédiatement pour tous les utilisateurs.
        </p>
      </div>

      {DEFAULT_VIP_CONFIGS.map((cfg) => (
        <Card key={cfg.level}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              ★&nbsp;
              <input
                className="font-bold bg-transparent border-b border-dashed border-muted-foreground/40 focus:outline-none focus:border-primary w-20 text-sm"
                value={val(`vip${cfg.level}Label`, cfg.label)}
                onChange={(e) => set(`vip${cfg.level}Label`, e.target.value)}
              />
              <span className="text-xs font-normal text-muted-foreground">— Niveau {cfg.level}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* ── Conditions ── */}
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Conditions d'accès</p>

              {/* Investissement requis — toujours vrai pour niv 1+ */}
              {cfg.level >= 1 && (
                <p className="text-xs text-muted-foreground italic">
                  ✦ Premier investissement requis (non modifiable)
                </p>
              )}

              {/* Filleuls directs A */}
              {(cfg.minDirectA !== null || cfg.level === 2 || cfg.level === 3) && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-52 shrink-0">
                    Filleuls directs minimum (niveau A)
                  </label>
                  <Input
                    type="number" min="0"
                    className="h-8 text-sm w-24"
                    placeholder="–"
                    value={val(`vip${cfg.level}MinDirectA`, cfg.minDirectA !== null ? String(cfg.minDirectA) : "")}
                    onChange={(e) => set(`vip${cfg.level}MinDirectA`, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">membres A</span>
                </div>
              )}

              {/* Membres niveau B */}
              {(cfg.minLevelB !== null || cfg.level === 3) && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-52 shrink-0">
                    Membres niveau B minimum
                  </label>
                  <Input
                    type="number" min="0"
                    className="h-8 text-sm w-24"
                    placeholder="–"
                    value={val(`vip${cfg.level}MinLevelB`, cfg.minLevelB !== null ? String(cfg.minLevelB) : "")}
                    onChange={(e) => set(`vip${cfg.level}MinLevelB`, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">membres B</span>
                </div>
              )}

              {/* Équipe totale */}
              {(cfg.minTotalTeam !== null || cfg.level >= 4) && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-52 shrink-0">
                    Membres totaux minimum (A+B+C)
                  </label>
                  <Input
                    type="number" min="0"
                    className="h-8 text-sm w-24"
                    placeholder="–"
                    value={val(`vip${cfg.level}MinTotalTeam`, cfg.minTotalTeam !== null ? String(cfg.minTotalTeam) : "")}
                    onChange={(e) => set(`vip${cfg.level}MinTotalTeam`, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">membres</span>
                </div>
              )}

              {/* Récompense */}
              {cfg.level >= 2 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-52 shrink-0">
                    Récompense de passage (FCFA)
                  </label>
                  <Input
                    type="number" min="0"
                    className="h-8 text-sm w-24"
                    placeholder="0"
                    value={val(`vip${cfg.level}Reward`, String(cfg.reward))}
                    onChange={(e) => set(`vip${cfg.level}Reward`, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">FCFA</span>
                </div>
              )}
            </div>

            {/* ── Textes ── */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Textes affichés</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={cfg.description}
                  value={val(`vip${cfg.level}Description`, cfg.description)}
                  onChange={(e) => set(`vip${cfg.level}Description`, e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Avantages</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={cfg.advantages}
                  value={val(`vip${cfg.level}Advantages`, cfg.advantages)}
                  onChange={(e) => set(`vip${cfg.level}Advantages`, e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>
      ))}

      <Button
        className="w-full"
        disabled={saveMutation.isPending || Object.keys(form).length === 0}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending
          ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
          : <Save className="w-4 h-4 mr-2" />}
        Enregistrer tous les paramètres VIP
      </Button>
    </div>
  );
}
