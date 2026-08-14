import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Country } from "@shared/schema";

interface CountryForm {
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  operators: string;
  isActive: boolean;
  autoPaymentEnabled: boolean;
}

const emptyForm: CountryForm = {
  code: "",
  name: "",
  currency: "FCFA",
  phonePrefix: "",
  operators: "",
  isActive: true,
  autoPaymentEnabled: false,
};

export default function AdminCountries() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CountryForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: countriesList, isLoading } = useQuery<Country[]>({
    queryKey: ["/api/admin/countries"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CountryForm) => {
      const payload = {
        ...data,
        operators: JSON.stringify(
          data.operators.split(",").map(o => o.trim()).filter(Boolean)
        ),
      };
      if (editingId) {
        const res = await apiRequest("PUT", `/api/admin/countries/${editingId}`, payload);
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/countries", payload);
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({ title: editingId ? t.adminCountryUpdated : t.adminCountryAdded });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => {
      toast({ title: e.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/countries/${id}`);
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({ title: t.adminCountryDeleted });
      setDeleteId(null);
    },
    onError: (e: any) => {
      toast({ title: e.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/countries/${id}`, { isActive });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
    },
  });

  const openEdit = (c: Country) => {
    let operatorsStr = "";
    try { operatorsStr = JSON.parse(c.operators).join(", "); } catch {}
    setForm({
      code: c.code,
      name: c.name,
      currency: c.currency,
      phonePrefix: c.phonePrefix,
      operators: operatorsStr,
      isActive: c.isActive,
      autoPaymentEnabled: c.autoPaymentEnabled ?? false,
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t.adminCountriesTitle} ({countriesList?.length ?? 0})
        </h2>
        <Button onClick={openAdd} size="sm" data-testid="button-add-country">
          <Plus className="w-4 h-4 mr-1" />
          {t.adminAddCountry}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">{t.loading}</p>}

      <div className="grid gap-3">
        {countriesList?.map((c) => {
          let ops: string[] = [];
          try { ops = JSON.parse(c.operators); } catch {}
          return (
            <Card key={c.id} data-testid={`card-country-${c.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-base">{c.name}</span>
                      <Badge variant="outline" className="text-xs">{c.code}</Badge>
                      <Badge variant="secondary" className="text-xs">{c.currency}</Badge>
                      <Badge variant="outline" className="text-xs">{t.adminManualPayment}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t.adminCountryPhoneDisplay}{c.phonePrefix}
                    </p>
                    {ops.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ops.map((op) => (
                          <Badge key={op} variant="outline" className="text-xs font-normal">{op}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, isActive: v })}
                      title={t.adminCountryActiveLabel}
                      data-testid={`switch-country-active-${c.id}`}
                    />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)} data-testid={`button-edit-country-${c.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(c.id)} data-testid={`button-delete-country-${c.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {countriesList?.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">{t.adminNoCountries}</p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t.adminEditCountry : t.adminAddCountry}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.adminCountryCodeLabel}</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="CM"
                  maxLength={3}
                  disabled={!!editingId}
                  required
                  data-testid="input-country-code"
                />
              </div>
              <div>
                <Label>{t.adminCountryCurrencyLabel}</Label>
                <Input
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                  placeholder="FCFA"
                  maxLength={5}
                  required
                  data-testid="input-country-currency"
                />
              </div>
            </div>
            <div>
              <Label>{t.adminCountryNameLabel}</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Cameroun"
                required
                data-testid="input-country-name"
              />
            </div>
            <div>
              <Label>{t.adminCountryPhoneLabel}</Label>
              <Input
                value={form.phonePrefix}
                onChange={e => setForm({ ...form, phonePrefix: e.target.value })}
                placeholder="235"
                required
                data-testid="input-country-prefix"
              />
            </div>
            <div>
              <Label>{t.adminCountryOperatorsLabel}</Label>
              <Input
                value={form.operators}
                onChange={e => setForm({ ...form, operators: e.target.value })}
                placeholder="Airtel Money, Moov Money"
                data-testid="input-country-operators"
              />
              <p className="text-xs text-muted-foreground mt-1">{t.adminCountryOperatorsHint}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm({ ...form, isActive: v })}
                id="country-active"
              />
              <Label htmlFor="country-active">{t.adminCountryActiveLabel}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}>
                {t.adminCancel}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-country">
                {saveMutation.isPending ? t.saving : t.adminSave}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.adminDeleteCountryTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.adminCountryIrreversible}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t.adminCancel}</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {t.adminTaskDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
