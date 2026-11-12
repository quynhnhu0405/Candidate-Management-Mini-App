import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Card>
      <EmptyState
        icon={Compass}
        title={t("notFound.title")}
        description={t("notFound.description")}
        action={
          <Button asChild>
            <Link to="/">{t("common.backToCandidates")}</Link>
          </Button>
        }
      />
    </Card>
  );
}
