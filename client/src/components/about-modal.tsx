import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

const poweraddLogo = "/poweradd/poweradd-logo-official.png";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <img src={poweraddLogo} alt="Power Add" className="w-10 h-10 object-contain" />
            </div>
            {t.aboutTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{t.aboutDesc1}</p>
          <p>{t.aboutDesc2}</p>
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-foreground">{t.aboutSpecialties}</h4>
            <ul className="space-y-1">
              <li>{t.aboutSpec1}</li>
              <li>{t.aboutSpec2}</li>
              <li>{t.aboutSpec3}</li>
              <li>{t.aboutSpec4}</li>
            </ul>
          </div>
          <p className="text-xs">{t.aboutVersion}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
