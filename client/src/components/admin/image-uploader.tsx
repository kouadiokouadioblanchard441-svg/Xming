/**
 * ImageUploader — composant réutilisable d'upload d'image depuis la galerie.
 * Envoie le fichier au serveur via POST /api/admin/upload et retourne l'URL publique.
 * Pas de base64, pas de lien manuel à saisir.
 */
import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  value: string;           // URL actuelle de l'image
  onChange: (url: string) => void;
  label?: string;
  maxSizeMb?: number;
  previewHeight?: number;
}

export default function ImageUploader({
  value,
  onChange,
  label = "Image",
  maxSizeMb = 5,
  previewHeight = 120,
}: ImageUploaderProps) {
  const { toast } = useToast();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast({ title: "Image trop lourde", description: `Maximum ${maxSizeMb} Mo`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Erreur upload" }));
        throw new Error(err.message || "Erreur upload");
      }

      const { url } = await res.json();
      onChange(url);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium leading-none">{label}</p>
      )}

      {/* Preview */}
      {value && (
        <div
          className="relative w-full rounded-xl border border-border overflow-hidden bg-secondary/30"
          style={{ height: previewHeight }}
        >
          <img src={value} alt="Aperçu" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 hover:opacity-80 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Pick button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => fileRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4 mr-2" />
        )}
        {loading ? "Envoi en cours…" : value ? "Changer l'image" : "Choisir depuis la galerie"}
      </Button>
    </div>
  );
}
