import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CompanyContent } from "@shared/schema";

type ContentForm = {
  title: string;
  body: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: ContentForm = {
  title: "",
  body: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
};

function toForm(block: CompanyContent): ContentForm {
  return {
    title: block.title,
    body: block.body,
    imageUrl: block.imageUrl || "",
    sortOrder: String(block.sortOrder),
    isActive: block.isActive,
  };
}

export default function AdminCompanyContent() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const { data: blocks, isLoading } = useQuery<CompanyContent[]>({
    queryKey: ["/api/admin/company-content"],
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: ContentForm }) => {
      const method = id ? "PATCH" : "POST";
      const url = id ? `/api/admin/company-content/${id}` : "/api/admin/company-content";
      const response = await apiRequest(method, url, {
        ...data,
        sortOrder: Number(data.sortOrder) || 0,
        imageUrl: data.imageUrl || null,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-content"] });
      toast({ title: editingId ? t.adminCompanyBlockModified : t.adminCompanyBlockAdded });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/company-content/${id}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-content"] });
      toast({ title: t.adminCompanyBlockDeleted });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/company-content/${id}`, { isActive });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-content"] });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const updateForm = (key: keyof ContentForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t.adminCompanyBlockImageTooBig, description: t.adminCompanyBlockImageMaxSize, variant: "destructive" });
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateForm("imageUrl", reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: String((blocks?.length || 0) + 1) });
    setShowForm(true);
  };

  const startEdit = (block: CompanyContent) => {
    setEditingId(block.id);
    setForm(toForm(block));
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t.adminCompanyDesc}
        </p>
        <Button onClick={startCreate} className="shrink-0" data-testid="button-add-company-content">
          <Plus className="w-4 h-4 mr-2" /> {t.adminCompanyAdd}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{editingId ? t.adminCompanyEditBlock : t.adminCompanyNewBlock}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label={t.cancel}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-content-title">{t.adminCompanyBlockTitle}</Label>
              <Input
                id="company-content-title"
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder={t.adminCompanyBlockTitlePlaceholder}
                data-testid="input-company-content-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-content-body">{t.adminCompanyBlockBody}</Label>
              <Textarea
                id="company-content-body"
                value={form.body}
                onChange={(event) => updateForm("body", event.target.value)}
                rows={6}
                placeholder={t.adminCompanyBlockBodyPlaceholder}
                data-testid="input-company-content-body"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.adminCompanyBlockImage} <span className="font-normal text-muted-foreground">{t.adminCompanyBlockImageOptional}</span></Label>
              {form.imageUrl && (
                <div className="relative h-32 rounded-xl border overflow-hidden bg-secondary/30">
                  <img src={form.imageUrl} alt={t.adminCompanyBlockPreview} className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => updateForm("imageUrl", "")}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white"
                    aria-label={t.adminCompanyBlockImageRemove}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" id="company-content-image" onChange={handleFile} />
              <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById("company-content-image")?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" /> {form.imageUrl ? t.adminCompanyBlockImageChange : t.adminCompanyBlockImageChoose}
              </Button>
              <Input
                value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                onChange={(event) => updateForm("imageUrl", event.target.value)}
                placeholder={t.adminCompanyBlockImageUrlPlaceholder}
                data-testid="input-company-content-image-url"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="company-content-order">{t.adminCompanyBlockOrder}</Label>
                <Input id="company-content-order" type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", event.target.value)} />
              </div>
              <div className="flex items-center gap-3 pb-2">
                <Switch checked={form.isActive} onCheckedChange={(checked) => updateForm("isActive", checked)} />
                <Label>{t.adminCompanyBlockVisible}</Label>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={saveMutation.isPending || !form.title.trim()}
              onClick={() => saveMutation.mutate({ id: editingId || undefined, data: form })}
              data-testid="button-save-company-content"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {t.adminCompanyBlockSave}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : blocks && blocks.length > 0 ? (
        blocks.map((block) => (
          <Card key={block.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                {block.imageUrl ? (
                  <img src={block.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0 border" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold truncate">{block.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.adminCompanyBlockOrder} {block.sortOrder} · {block.isActive ? t.adminCompanyBlockVisible : t.adminCompanyBlockHidden}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={block.isActive} onCheckedChange={(isActive) => toggleMutation.mutate({ id: block.id, isActive })} />
                      <Button size="icon" variant="ghost" onClick={() => startEdit(block)} aria-label={t.adminCompanyEditBlock}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => { if (confirm(`${t.adminCompanyBlockDeletePrefix} ${block.title} » ?`)) deleteMutation.mutate(block.id); }}
                        aria-label={t.adminTaskDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 whitespace-pre-line">{block.body || t.adminCompanyBlockNoText}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">{t.adminCompanyEmpty}</div>
      )}
    </div>
  );
}
