import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Headphones, MessageCircle, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  supportLink: string;
  channelLink: string;
  groupLink: string;
}

export default function ServiceModal({ open, onClose, supportLink, channelLink, groupLink }: ServiceModalProps) {
  const { t } = useI18n();
  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{t.serviceTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full flex items-center justify-start gap-3 h-auto py-4"
            onClick={() => openLink(supportLink)}
            data-testid="button-support"
          >
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-gray-800" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{t.serviceCustomerServiceFallback}</p>
              <p className="text-xs text-muted-foreground">{t.serviceOnlineConsult}</p>
            </div>
          </Button>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-start gap-3 h-auto py-4"
            onClick={() => openLink(channelLink)}
            data-testid="button-channel"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{t.serviceOfficialChannelFallback}</p>
              <p className="text-xs text-muted-foreground">{t.serviceAnnouncements}</p>
            </div>
          </Button>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-start gap-3 h-auto py-4"
            onClick={() => openLink(groupLink)}
            data-testid="button-group"
          >
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-800" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{t.serviceDiscussionGroupFallback}</p>
              <p className="text-xs text-muted-foreground">{t.serviceCommunity}</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
