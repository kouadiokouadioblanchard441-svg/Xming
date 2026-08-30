import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, RotateCcw, Image as ImageIcon, Trophy, AlertCircle, MessageSquare } from "lucide-react";
import { DEFAULT_SPIN_WHEEL_SEGMENTS, type SpinWheelSegment } from "@shared/spin-wheel";

const SEGMENT_NAMES = ["Case 1", "Case 2", "Case 3", "Case 4", "Case 5", "Case 6", "Case 7", "Case 8"];

function SegmentCard({
  seg,
  index,
  onChange,
}: {
  seg: SpinWheelSegment;
  index: number;
  onChange: (index: number, field: keyof SpinWheelSegment, value: any) => void;
}) {
  return (
    <Card className={`border-2 transition-all ${seg.canWin ? "border-primary/40" : "border-muted"}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: seg.color }}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{SEGMENT_NAMES[index]}</p>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={seg.canWin}
              onChange={e => onChange(index, "canWin", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs font-medium text-muted-foreground">Gagnable</span>
          </label>
          <Badge variant={seg.canWin ? "default" : "secondary"} className="text-xs shrink-0">
            {seg.canWin ? <Trophy className="w-3 h-3 mr-1" /> : null}
            {seg.canWin ? "Prix" : "Non-gagnant"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Label */}
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Texte affiché *</label>
            <Input
              value={seg.label}
              maxLength={40}
              placeholder="Petit gain, Grand prix…"
              onChange={e => onChange(index, "label", e.target.value)}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Montant gagné (FCFA)
            </label>
            <Input
              type="number"
              min={0}
              value={seg.amount}
              onChange={e => onChange(index, "amount", parseFloat(e.target.value) || 0)}
              disabled={!seg.canWin}
            />
          </div>

          {/* Weight */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Probabilité (poids)
            </label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={seg.weight ?? 1}
              onChange={e => onChange(index, "weight", parseFloat(e.target.value) || 1)}
              disabled={!seg.canWin}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Couleur de fond</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={seg.color}
                onChange={e => onChange(index, "color", e.target.value)}
                className="w-10 h-9 rounded border border-input cursor-pointer p-0.5"
              />
              <Input
                value={seg.color}
                onChange={e => onChange(index, "color", e.target.value)}
                className="flex-1 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>

          {/* Dark / text color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Couleur du texte</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={seg.dark}
                onChange={e => onChange(index, "dark", e.target.value)}
                className="w-10 h-9 rounded border border-input cursor-pointer p-0.5"
              />
              <Input
                value={seg.dark}
                onChange={e => onChange(index, "dark", e.target.value)}
                className="flex-1 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Image URL (optionnel — remplace les pièces)
            </label>
            <div className="flex gap-2 items-center">
              <Input
                value={seg.imageUrl ?? ""}
                placeholder="https://…/image.png"
                onChange={e => onChange(index, "imageUrl", e.target.value || undefined)}
                className="flex-1"
              />
              {seg.imageUrl && (
                <img
                  src={seg.imageUrl}
                  alt=""
                  className="w-9 h-9 rounded-lg object-contain border border-input bg-white shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Probability hint */}
        {seg.canWin && (
          <p className="text-xs text-muted-foreground">
            Poids : plus c'est élevé, plus cette case sortira souvent.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   POPUP TEXT EDITOR SECTION
══════════════════════════════════════════════════════════════════ */
function PopupTextsEditor() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const [inviteText,      setInviteText]      = useState("");
  const [inviteHighlight, setInviteHighlight] = useState("");
  const [rulesText,       setRulesText]       = useState("");
  const [rulesHighlight,  setRulesHighlight]  = useState("");
  const [textDirty, setTextDirty] = useState(false);

  // Charge les valeurs depuis le serveur uniquement si l'admin n'a pas
  // de modifications en cours (évite d'écraser un texte en cours de saisie).
  useEffect(() => {
    if (!settings || textDirty) return;
    setInviteText(settings.spinWheelInviteText ?? "");
    setInviteHighlight(settings.spinWheelInviteHighlight ?? "");
    setRulesText(settings.spinWheelRulesText ?? "");
    setRulesHighlight(settings.spinWheelRulesHighlight ?? "");
  // "textDirty" est intentionnellement absent : on veut relire le serveur
  // seulement quand settings change, pas quand l'admin tape.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const saveTexts = useMutation({
    mutationFn: async () => {
      const keys = [
        { key: "spinWheelInviteText",      value: inviteText },
        { key: "spinWheelInviteHighlight", value: inviteHighlight },
        { key: "spinWheelRulesText",       value: rulesText },
        { key: "spinWheelRulesHighlight",  value: rulesHighlight },
      ];
      for (const kv of keys) {
        await apiRequest("POST", "/api/admin/settings", kv);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setTextDirty(false);
      toast({ title: "✅ Textes des popups sauvegardés" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const change = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setTextDirty(true);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Textes des popups</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Ces textes s'affichent lorsque l'utilisateur clique sur "?" (règles) ou "+" (invitation).
        </p>

        {/* Invite popup */}
        <div className="space-y-2 rounded-xl border p-3 bg-muted/20">
          <p className="text-sm font-semibold">Popup "+" — Invitation</p>
          <div>
            <label className="text-xs text-muted-foreground">Texte complet</label>
            <textarea
              value={inviteText}
              onChange={change(setInviteText)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Invitez vos amis…"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mot(s) en rouge/gras (optionnel)</label>
            <Input value={inviteHighlight} onChange={change(setInviteHighlight)} placeholder="50" />
          </div>
          {/* Preview */}
          {inviteText && (
            <div className="rounded-xl border bg-white p-4 text-sm leading-relaxed text-gray-800">
              {inviteHighlight && inviteText.includes(inviteHighlight) ? (
                <>
                  {inviteText.slice(0, inviteText.indexOf(inviteHighlight))}
                  <span className="font-extrabold text-red-500">{inviteHighlight}</span>
                  {inviteText.slice(inviteText.indexOf(inviteHighlight) + inviteHighlight.length)}
                </>
              ) : inviteText}
            </div>
          )}
        </div>

        {/* Rules popup */}
        <div className="space-y-2 rounded-xl border p-3 bg-muted/20">
          <p className="text-sm font-semibold">Popup "?" — Règles</p>
          <div>
            <label className="text-xs text-muted-foreground">Texte complet</label>
            <textarea
              value={rulesText}
              onChange={change(setRulesText)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Achetez un produit pour obtenir des tours…"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mot(s) en rouge/gras (optionnel)</label>
            <Input value={rulesHighlight} onChange={change(setRulesHighlight)} placeholder="" />
          </div>
          {/* Preview */}
          {rulesText && (
            <div className="rounded-xl border bg-white p-4 text-sm leading-relaxed text-gray-800">
              {rulesHighlight && rulesText.includes(rulesHighlight) ? (
                <>
                  {rulesText.slice(0, rulesText.indexOf(rulesHighlight))}
                  <span className="font-extrabold text-red-500">{rulesHighlight}</span>
                  {rulesText.slice(rulesText.indexOf(rulesHighlight) + rulesHighlight.length)}
                </>
              ) : rulesText}
            </div>
          )}
        </div>

        <Button
          onClick={() => saveTexts.mutate()}
          disabled={!textDirty || saveTexts.isPending}
          className="gap-1 w-full"
        >
          {saveTexts.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder les textes
        </Button>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function AdminSpinWheelConfig() {
  const { toast } = useToast();
  const [segments, setSegments] = useState<SpinWheelSegment[]>(DEFAULT_SPIN_WHEEL_SEGMENTS);
  const [dirty, setDirty] = useState(false);

  const { data: saved, isLoading } = useQuery<SpinWheelSegment[]>({
    queryKey: ["/api/admin/spin-wheel/config"],
  });

  useEffect(() => {
    if (saved?.length === 8) {
      setSegments(saved);
      setDirty(false);
    }
  }, [saved]);

  const handleChange = (index: number, field: keyof SpinWheelSegment, value: any) => {
    setSegments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/spin-wheel/config", { segments });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spin-wheel/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spin-wheel/config"] });
      setSegments(data);
      setDirty(false);
      toast({ title: "✅ Configuration sauvegardée" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const reset = () => {
    if (saved?.length === 8) { setSegments(saved); setDirty(false); }
    else { setSegments(DEFAULT_SPIN_WHEEL_SEGMENTS); setDirty(false); }
  };

  // Compute probability percentages for display
  const winnableSegs = segments.filter(s => s.canWin);
  const totalWeight = winnableSegs.reduce((s, sg) => s + (sg.weight ?? 1), 0);

  const hasNoWinner = !segments.some(s => s.canWin);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">Configuration de la roue</h2>
          <p className="text-sm text-muted-foreground">
            8 cases configurables — couleurs, prix, images, probabilités.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={!dirty || saveMutation.isPending} className="gap-1">
            <RotateCcw className="w-4 h-4" /> Annuler
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isPending || hasNoWinner}
            className="gap-1"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Warning */}
      {hasNoWinner && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Au moins une case doit être cochée "Gagnable".
        </div>
      )}

      {/* Probability summary */}
      {winnableSegs.length > 0 && (
        <div className="rounded-xl border bg-muted/40 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Probabilités des cases gagnantes
          </p>
          <div className="flex flex-wrap gap-2">
            {winnableSegs.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/50"
                  style={{ background: s.color }}
                />
                <span className="font-medium">{s.label}</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {(((s.weight ?? 1) / totalWeight) * 100).toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      )}

      {/* Popup texts editor */}
      <PopupTextsEditor />

      {/* Segment cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((seg, i) => (
            <SegmentCard key={i} seg={seg} index={i} onChange={handleChange} />
          ))}
        </div>
      )}

      {/* Save bar at bottom */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            size="lg"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || hasNoWinner}
            className="gap-2 shadow-xl"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder les modifications
          </Button>
        </div>
      )}
    </div>
  );
}
