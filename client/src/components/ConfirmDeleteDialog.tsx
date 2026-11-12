import { Loader2 } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Candidate } from "@/types/candidate";

// Confirmation dialog before deleting (FR-03). Pass candidate=null to close it.
export function ConfirmDeleteDialog({
  candidate,
  isDeleting,
  onConfirm,
  onClose,
}: {
  candidate: Candidate | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={!!candidate} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            <Trans
              i18nKey="deleteDialog.description"
              values={{ name: candidate?.fullName ?? "" }}
              components={{ b: <span className="font-medium text-foreground" /> }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("common.cancel")}</AlertDialogCancel>
          {/* Plain Button (not AlertDialogAction) so the dialog stays open while the request runs */}
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="animate-spin" />}
            {t("common.delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
