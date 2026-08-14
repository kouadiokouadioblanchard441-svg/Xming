/**
 * AdminBannerConfig — gestion des deux bannières défilantes de la page d'accueil.
 * Upload depuis la galerie via POST /api/admin/upload (pas de base64, pas d'URL manuelle).
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Trash2, Image as ImageIcon } from "lucide-react";
import ImageUploader from "@/components/admin/image-uploader";

/* ── Mini preview card ──────────────────────────────────────────────────── */
function ThumbCard({
  url,
  idx,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  url: string;
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [ok, setOk] = useState(true);
  return (
    <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
      {ok ? (
        <img
          src={url}
          onError={() => setOk(false)}
          className="w-full rounded-lg object-cover"
          style={{ height: 80 }}
          alt=""
        />
      ) : (
        <div className="w-full rounded-lg flex items-center justify-center bg-muted" style={{ height: 80 }}>
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs font-mono text-muted-foreground truncate">{url}</span>
        <div className="flex gap-1 shrink-0">
          <button onClick={onMoveUp}  disabled={idx === 0}          className="text-xs px-1.5 py-0.5 rounded border disabled:opacity-30 hover:bg-muted" title="Monter">↑</button>
          <button onClick={onMoveDown} disabled={idx === total - 1}  className="text-xs px-1.5 py-0.5 rounded border disabled:opacity-30 hover:bg-muted" title="Descendre">↓</button>
          <button onClick={onRemove}   className="text-destructive hover:text-destructive/70" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

/* ── Single banner slot editor ──────────────────────────────────────────── */
function BannerSlotEditor({
  label,
  settingKey,
}: {
  label: string;
  settingKey: "banner1Images" | "banner2Images";
}) {
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const [urls, setUrls]   = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!settings) return;
    try {
      const parsed = JSON.parse(settings[settingKey] || "[]");
      setUrls(Array.isArray(parsed) ? parsed : []);
    } catch { setUrls([]); }
    setDirty(false);
  }, [settings, settingKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/settings", { key: settingKey, value: JSON.stringify(urls) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setDirty(false);
      toast({ title: `✅ ${label} sauvegardée` });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  function addImage(url: string) {
    if (!url) return;
    setUrls(prev => [...prev, url]);
    setDirty(true);
  }
  function remove(idx: number)    { setUrls(prev => prev.filter((_, i) => i !== idx)); setDirty(true); }
  function moveUp(idx: number)    { if (idx === 0) return; setUrls(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; }); setDirty(true); }
  function moveDown(idx: number)  { setUrls(prev => { if (idx >= prev.length - 1) return prev; const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; }); setDirty(true); }

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              {label}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {urls.length} image{urls.length !== 1 ? "s" : ""} — défilement automatique
            </p>
          </div>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending} className="gap-1">
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Sauvegarder
          </Button>
        </div>

        {/* Uploaded images list */}
        {urls.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucune image — uploadez une depuis votre galerie.
          </div>
        ) : (
          <div className="space-y-3">
            {urls.map((url, idx) => (
              <ThumbCard
                key={idx}
                url={url}
                idx={idx}
                total={urls.length}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
                onRemove={() => remove(idx)}
              />
            ))}
          </div>
        )}

        {/* Upload from gallery */}
        <div className="rounded-xl border border-dashed p-4 bg-muted/10">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Ajouter une image depuis votre galerie :</p>
          <ImageUploader
            value=""
            onChange={(url) => { if (url) addImage(url); }}
            label=""
            previewHeight={0}
            maxSizeMb={10}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main export ────────────────────────────────────────────────────────── */
export default function AdminBannerConfig() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Bannières de la page d'accueil</h2>
        <p className="text-sm text-muted-foreground">
          Uploadez vos images depuis votre galerie. Elles défilent automatiquement toutes les 3,5 s.
        </p>
      </div>
      <BannerSlotEditor label="🖼 Bannière du haut (pleine largeur)" settingKey="banner1Images" />
      <BannerSlotEditor label="🖼 Bannière du milieu (carte arrondie)" settingKey="banner2Images" />
    </div>
  );
}
