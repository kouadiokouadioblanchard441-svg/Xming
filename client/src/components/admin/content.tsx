import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CONTENT_GROUPS, ALL_CONTENT_FIELDS } from "@shared/content-fields";

export default function AdminContent() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      for (const field of ALL_CONTENT_FIELDS) {
        initial[field.key] = settings[field.key] ?? field.defaultValue;
      }
      setValues(initial);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: t.adminContentSaved });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t.adminContentDesc}
      </p>

      {CONTENT_GROUPS.map((group) => (
        <Card key={group.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {group.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.multiline ? (
                  <Textarea
                    id={field.key}
                    value={values[field.key] ?? field.defaultValue}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    rows={field.defaultValue.length > 80 ? 4 : 2}
                    data-testid={`input-content-${field.key}`}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={values[field.key] ?? field.defaultValue}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    data-testid={`input-content-${field.key}`}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        className="w-full"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate(values)}
        data-testid="button-save-content"
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            {t.adminContentSave}
          </>
        )}
      </Button>
    </div>
  );
}
