import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Loader2, TrendingUp, Plus, Trash2, Users, ShoppingBag, Lock } from "lucide-react";
import type { Product } from "@shared/schema";
import ImageUploader from "@/components/admin/image-uploader";

const productSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  price: z.string().min(1, "Prix requis"),
  dailyEarnings: z.string().min(1, "Gains journaliers requis"),
  cycleDays: z.string().min(1, "Durée requise"),
  imageUrl: z.string().optional(),
  minInviteCount: z.string().optional(),
  maxOwned: z.string().optional(),
  collectAtEnd: z.boolean().optional(),
  stockPercentage: z.number().min(0).max(100).optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// ─── ImageUploadField ────────────────────────────────────────────────────────
function ImageUploadField({ form }: { form: any }) {
  const currentValue: string = form.watch("imageUrl") || "";
  return (
    <FormField
      control={form.control}
      name="imageUrl"
      render={() => (
        <FormItem>
          <FormLabel>Image <span className="text-muted-foreground font-normal">(optionnel)</span></FormLabel>
          <ImageUploader
            value={currentValue}
            onChange={(url) => form.setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true })}
            label=""
            previewHeight={112}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ─── ProductFormFields ───────────────────────────────────────────────────────
interface ProductFormFieldsProps {
  form: any;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: ProductForm) => void;
}

function ProductFormFields({ form, isPending, submitLabel, onSubmit }: ProductFormFieldsProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Nom du produit</FormLabel>
          <FormControl><Input {...field} placeholder="Ex: VIP 3" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Price + Daily */}
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem>
            <FormLabel>Prix (FCFA)</FormLabel>
            <FormControl><Input {...field} type="number" placeholder="Ex: 15000" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="dailyEarnings" render={({ field }) => (
          <FormItem>
            <FormLabel>Gains/jour</FormLabel>
            <FormControl><Input {...field} type="number" placeholder="Ex: 300" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Cycle */}
      <FormField control={form.control} name="cycleDays" render={({ field }) => (
        <FormItem>
          <FormLabel>Durée (jours)</FormLabel>
          <FormControl><Input {...field} type="number" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Total return preview */}
      {form.watch("price") && form.watch("dailyEarnings") && form.watch("cycleDays") && (
        <div className="bg-primary/10 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">Retour total estimé :</p>
          <p className="font-bold text-primary text-lg">
            {(parseFloat(form.watch("dailyEarnings") || "0") * parseInt(form.watch("cycleDays") || "0")).toLocaleString()} FCFA
          </p>
        </div>
      )}

      {/* Conditions */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Conditions d'achat
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="minInviteCount" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs flex items-center gap-1">
                <Users className="w-3 h-3" /> Min. invitations
              </FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" placeholder="0 = aucune" />
              </FormControl>
              <p className="text-[10px] text-muted-foreground">0 = pas de condition</p>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="maxOwned" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Max achats / utilisateur</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" placeholder="0 = illimité" />
              </FormControl>
              <p className="text-[10px] text-muted-foreground">0 = illimité</p>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Collect mode */}
      <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
        <FormField control={form.control} name="collectAtEnd" render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-3">
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                className="mt-0.5"
              />
              <div>
                <FormLabel className="text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Collecte en fin de cycle
                </FormLabel>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Les gains s'accumulent pendant tout le cycle. L'utilisateur ne peut collecter qu'à la fin.
                </p>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Stock percentage */}
      <div className="border rounded-lg p-3 space-y-2 bg-slate-50">
        <FormField control={form.control} name="stockPercentage" render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between mb-1">
              <FormLabel className="text-sm font-semibold">
                📊 Taux de remplissage du stock
              </FormLabel>
              <span
                className="text-sm font-extrabold px-2 py-0.5 rounded-full text-white"
                style={{
                  background: (field.value ?? 0) >= 100
                    ? "#ef4444"
                    : (field.value ?? 0) >= 75
                    ? "#8b5cf6"
                    : (field.value ?? 0) >= 50
                    ? "#f97316"
                    : (field.value ?? 0) >= 25
                    ? "#eab308"
                    : "#22c55e",
                }}
              >
                {field.value ?? 0}%
              </span>
            </div>
            <FormControl>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={field.value ?? 0}
                onChange={e => field.onChange(Number(e.target.value))}
                className="w-full accent-current h-2 rounded-full cursor-pointer"
              />
            </FormControl>
            <p className="text-[10px] text-muted-foreground">
              À 100% → produit épuisé, achat bloqué
            </p>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Image */}
      <ImageUploadField form={form} />

      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-product">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );
}

// ─── AdminProducts ────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products/all"],
  });

  const defaultValues: ProductForm = {
    name: "", price: "", dailyEarnings: "", cycleDays: "80",
    imageUrl: "", minInviteCount: "0", maxOwned: "0", collectAtEnd: false, stockPercentage: 0,
  };

  const editForm = useForm<ProductForm>({ resolver: zodResolver(productSchema), defaultValues });
  const createForm = useForm<ProductForm>({ resolver: zodResolver(productSchema), defaultValues });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const res = await apiRequest("POST", "/api/admin/products", data);
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "✅ Produit créé!" });
      setShowCreateForm(false);
      createForm.reset(defaultValues);
    },
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductForm }) => {
      const payload = {
        name: data.name,
        price: parseFloat(data.price),
        dailyEarnings: parseFloat(data.dailyEarnings),
        cycleDays: parseInt(data.cycleDays),
        totalReturn: parseFloat((parseFloat(data.dailyEarnings) * parseInt(data.cycleDays)).toFixed(2)),
        imageUrl: data.imageUrl || null,
        minInviteCount: parseInt(data.minInviteCount || "0") || 0,
        maxOwned: parseInt(data.maxOwned || "0") || 0,
        collectAtEnd: !!data.collectAtEnd,
        stockPercentage: Math.min(100, Math.max(0, data.stockPercentage ?? 0)),
      };
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, payload);
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "✅ Produit mis à jour!" });
      setSelectedProduct(null);
    },
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, { isActive });
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/products/${id}`, {});
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit supprimé" });
    },
    onError: (e: any) => toast({ title: e.message || "Erreur", variant: "destructive" }),
  });

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset({
      name: product.name,
      price: product.price.toString(),
      dailyEarnings: product.dailyEarnings.toString(),
      cycleDays: product.cycleDays.toString(),
      imageUrl: product.imageUrl || "",
      minInviteCount: String(product.minInviteCount ?? 0),
      maxOwned: String(product.maxOwned ?? 0),
      collectAtEnd: product.collectAtEnd ?? false,
      stockPercentage: product.stockPercentage ?? 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products?.length || 0} produit(s)</p>
        <Button onClick={() => { setShowCreateForm(true); createForm.reset(defaultValues); }} data-testid="button-add-product">
          <Plus className="w-4 h-4 mr-2" />Nouveau produit
        </Button>
      </div>

      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
      ) : products && products.length > 0 ? (
        products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-contain border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.isFree && <Badge variant="secondary" className="text-xs">Gratuit</Badge>}
                      <Badge variant={product.isActive ? "default" : "outline"} className="text-xs">
                        {product.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {Number(product.price).toLocaleString()} — {Number(product.dailyEarnings).toLocaleString()}/jour
                    </p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      {Number(product.minInviteCount) > 0 && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                          👥 {product.minInviteCount} invitations requises
                        </span>
                      )}
                      {Number(product.maxOwned) > 0 && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                          🛒 Max {product.maxOwned}/utilisateur
                        </span>
                      )}
                      {product.collectAtEnd && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                          🔒 Collecte fin de cycle
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, isActive: checked })}
                    data-testid={`switch-product-${product.id}`}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)} data-testid={`button-edit-product-${product.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!product.isFree && (
                    <Button
                      size="icon" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm(`Supprimer "${product.name}" ?`)) deleteMutation.mutate(product.id); }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Prix</p>
                  <p className="font-medium text-foreground">{Number(product.price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gains/jour</p>
                  <p className="font-medium text-foreground">{Number(product.dailyEarnings).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total ({product.cycleDays}j)</p>
                  <p className="font-medium text-primary">{Number(product.totalReturn).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">Aucun produit</div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={(open) => { if (!open) { setShowCreateForm(false); createForm.reset(defaultValues); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouveau produit</DialogTitle></DialogHeader>
          <Form {...createForm}>
            <ProductFormFields form={createForm} isPending={createMutation.isPending} submitLabel="Créer" onSubmit={(d) => createMutation.mutate(d)} />
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifier — {selectedProduct?.name}</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <ProductFormFields
              form={editForm}
              isPending={updateMutation.isPending}
              submitLabel="Enregistrer"
              onSubmit={(d) => { if (selectedProduct) updateMutation.mutate({ id: selectedProduct.id, data: d }); }}
            />
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
