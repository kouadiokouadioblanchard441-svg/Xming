import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus, Edit, Trash2, Phone, Loader2, Eye, EyeOff,
  ChevronDown, ChevronUp, Settings,
} from "lucide-react";
import type { DepositChannel, PaymentNumber } from "@shared/schema";

interface Country {
  id: number; code: string; name: string; phonePrefix: string; isActive: boolean;
}

const FLAGS: Record<string, string> = {
  CM: "🇨🇲", BF: "🇧🇫", TG: "🇹🇬", BJ: "🇧🇯", CI: "🇨🇮",
  CG: "🇨🇬", CD: "🇨🇩", CF: "🇨🇫", ML: "🇲🇱", SN: "🇸🇳",
};

/* ─── Empty forms ─────────────────────────── */
const emptyCh = { name: "", description: "", country: "", isActive: true, sortOrder: 0 };
const emptyOp = { ownerName: "", phone: "", operatorName: "", logoUrl: "", isActive: true };

/* ═══════════════════════════════════════════════════════════════════
   OPERATOR sub-panel (inside a channel card)
═══════════════════════════════════════════════════════════════════ */
function ChannelOperators({ channel }: { channel: DepositChannel }) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editOp, setEditOp] = useState<PaymentNumber | null>(null);
  const [form, setForm] = useState(emptyOp);

  const { data: operators = [], isLoading } = useQuery<PaymentNumber[]>({
    queryKey: [`/api/deposit-channels/${channel.id}/operators`],
    queryFn: async () => {
      // admin needs ALL operators (including inactive), so call admin endpoint
      const res = await apiRequest("GET", `/api/admin/payment-numbers`);
      const all: PaymentNumber[] = await res.json();
      return all.filter(n => n.channelId === channel.id);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, channelId: channel.id, country: channel.country };
      if (editOp) {
        await apiRequest("PUT", `/api/admin/payment-numbers/${editOp.id}`, payload);
      } else {
        await apiRequest("POST", `/api/admin/payment-numbers`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deposit-channels/${channel.id}/operators`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-numbers"] });
      setShowAdd(false);
      setEditOp(null);
      setForm(emptyOp);
      toast({ title: editOp ? "Opérateur modifié" : "Opérateur ajouté" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (op: PaymentNumber) =>
      apiRequest("PUT", `/api/admin/payment-numbers/${op.id}`, { isActive: !op.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deposit-channels/${channel.id}/operators`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-numbers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/payment-numbers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deposit-channels/${channel.id}/operators`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-numbers"] });
      toast({ title: "Opérateur supprimé" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const openEdit = (op: PaymentNumber) => {
    setEditOp(op);
    setForm({ ownerName: op.ownerName, phone: op.phone, operatorName: op.operatorName, logoUrl: op.logoUrl || "", isActive: op.isActive });
    setShowAdd(true);
  };

  return (
    <div className="mt-3 border-t pt-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Opérateurs ({operators.length})
        </span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => { setEditOp(null); setForm(emptyOp); setShowAdd(true); }}>
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
      </div>

      {isLoading && <Skeleton className="h-10 w-full" />}

      {operators.map(op => (
        <div key={op.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/30">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {op.logoUrl
              ? <img src={op.logoUrl} alt={op.operatorName} className="w-7 h-7 rounded-full object-contain" />
              : <Phone className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{op.operatorName}</p>
            <p className="text-xs text-muted-foreground truncate">{op.phone} · {op.ownerName}</p>
          </div>
          <Badge variant={op.isActive ? "default" : "secondary"} className="text-xs shrink-0">
            {op.isActive ? "Actif" : "Off"}
          </Badge>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
            onClick={() => toggleMutation.mutate(op)}>
            {op.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => openEdit(op)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive"
            onClick={() => { if (confirm("Supprimer cet opérateur ?")) deleteMutation.mutate(op.id); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}

      {operators.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground text-center py-3 italic">
          Aucun opérateur — cliquez "Ajouter" pour en créer un
        </p>
      )}

      {/* Operator form dialog */}
      <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) { setEditOp(null); setForm(emptyOp); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editOp ? "Modifier l'opérateur" : "Nouvel opérateur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom de l'opérateur *</label>
              <Input placeholder="MTN, Orange, Wave…" value={form.operatorName}
                onChange={e => setForm(f => ({ ...f, operatorName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Numéro de compte *</label>
              <Input placeholder="0612345678" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom du propriétaire *</label>
              <Input placeholder="Nom complet" value={form.ownerName}
                onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Logo URL (optionnel)</label>
              <Input placeholder="https://…" value={form.logoUrl}
                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span className="text-sm">Actif</span>
            </label>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAdd(false); setEditOp(null); setForm(emptyOp); }}>
                Annuler
              </Button>
              <Button className="flex-1" disabled={saveMutation.isPending || !form.operatorName || !form.phone || !form.ownerName}
                onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editOp ? "Mettre à jour" : "Ajouter")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function AdminDepositChannels() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<DepositChannel | null>(null);
  const [form, setForm] = useState(emptyCh);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: channels = [], isLoading } = useQuery<DepositChannel[]>({
    queryKey: ["/api/admin/deposit-channels"],
  });
  const { data: countries = [] } = useQuery<Country[]>({ queryKey: ["/api/countries"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editTarget) {
        await apiRequest("PUT", `/api/admin/deposit-channels/${editTarget.id}`, form);
      } else {
        await apiRequest("POST", `/api/admin/deposit-channels`, form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-channels"] });
      setShowForm(false);
      setEditTarget(null);
      setForm(emptyCh);
      toast({ title: editTarget ? "Canal modifié" : "Canal créé" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (ch: DepositChannel) =>
      apiRequest("PUT", `/api/admin/deposit-channels/${ch.id}`, { isActive: !ch.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-channels"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/deposit-channels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-channels"] });
      toast({ title: "Canal supprimé" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const openEdit = (ch: DepositChannel) => {
    setEditTarget(ch);
    setForm({ name: ch.name, description: ch.description || "", country: ch.country, isActive: ch.isActive, sortOrder: ch.sortOrder });
    setShowForm(true);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group channels by country
  const byCountry = channels.reduce<Record<string, DepositChannel[]>>((acc, ch) => {
    (acc[ch.country] ??= []).push(ch);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Canaux de dépôt</h2>
          <p className="text-sm text-muted-foreground">
            Chaque canal regroupe les opérateurs (MTN, Orange, Wave…) par pays.
          </p>
        </div>
        <Button onClick={() => { setEditTarget(null); setForm(emptyCh); setShowForm(true); }} className="gap-1">
          <Plus className="w-4 h-4" /> Nouveau canal
        </Button>
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      )}

      {/* Channels by country */}
      {!isLoading && Object.entries(byCountry).map(([country, chs]) => (
        <div key={country}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{FLAGS[country] ?? "🌍"}</span>
            <span className="font-semibold text-sm">{countries.find(c => c.code === country)?.name ?? country}</span>
            <Badge variant="outline" className="text-xs">{chs.length} canal{chs.length > 1 ? "x" : ""}</Badge>
          </div>

          <div className="space-y-2">
            {chs.sort((a, b) => a.sortOrder - b.sortOrder).map(ch => (
              <Card key={ch.id} className={`${!ch.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{ch.name}</span>
                        <Badge variant={ch.isActive ? "default" : "secondary"} className="text-xs">
                          {ch.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        {ch.sortOrder !== 0 && (
                          <Badge variant="outline" className="text-xs">Ordre : {ch.sortOrder}</Badge>
                        )}
                      </div>
                      {ch.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => toggleExpand(ch.id)}>
                        {expandedIds.has(ch.id)
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => toggleActiveMutation.mutate(ch)}>
                        {ch.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(ch)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                        onClick={() => { if (confirm(`Supprimer "${ch.name}" et tous ses opérateurs ?`)) deleteMutation.mutate(ch.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Operators sub-panel (expandable) */}
                  {expandedIds.has(ch.id) && <ChannelOperators channel={ch} />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {!isLoading && channels.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun canal configuré</p>
            <p className="text-sm mt-1">Créez votre premier canal de dépôt pour commencer.</p>
          </CardContent>
        </Card>
      )}

      {/* Channel form dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) { setEditTarget(null); setForm(emptyCh); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Modifier le canal" : "Nouveau canal de dépôt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom du canal *</label>
              <Input placeholder="Canal 1, Canal Mobile…" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description (optionnel)</label>
              <Input placeholder="Dépôts Mobile Money standard…" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pays *</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              >
                <option value="">— Sélectionner un pays —</option>
                {countries.filter(c => c.isActive).map(c => (
                  <option key={c.code} value={c.code}>
                    {FLAGS[c.code] ?? "🌍"} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Ordre d'affichage</label>
              <Input type="number" min={0} value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span className="text-sm">Canal actif</span>
            </label>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1"
                onClick={() => { setShowForm(false); setEditTarget(null); setForm(emptyCh); }}>
                Annuler
              </Button>
              <Button className="flex-1"
                disabled={saveMutation.isPending || !form.name || !form.country}
                onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTarget ? "Mettre à jour" : "Créer")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
