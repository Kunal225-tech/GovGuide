import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useSavedSchemes } from "@/context/SavedSchemesContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

interface SaveButtonProps {
  schemeId: string;
  schemeName?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function SaveButton({
  schemeId,
  schemeName,
  variant = "icon",
  className = "",
}: SaveButtonProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isSaved, toggleSave } = useSavedSchemes();
  const navigate = useNavigate();
  const [isBusy, setIsBusy] = useState(false);

  const saved = isSaved(schemeId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isBusy) return;

    try {
      setIsBusy(true);
      await toggleSave(schemeId);
    } catch (err) {
      console.error("Failed to toggle save scheme:", err);
    } finally {
      setIsBusy(false);
    }
  };

  const actionLabel = saved 
    ? (schemeName ? `${t('common.remove')} ${schemeName}` : t('common.remove'))
    : (schemeName ? `${t('common.save')} ${schemeName}` : t('common.save'));

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant={saved ? "default" : "outline"}
        onClick={handleClick}
        disabled={isBusy}
        className={cn(
          "inline-flex items-center gap-2 rounded-md font-bold px-5 h-11 shadow-none transition-colors",
          saved
            ? "bg-saffron hover:bg-saffron/90 text-white border-transparent"
            : "border-border text-navy hover:bg-surface-muted",
          className
        )}
        aria-label={actionLabel}
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : saved ? (
          <BookmarkCheck className="w-4 h-4 text-current fill-current" />
        ) : (
          <Bookmark className="w-4 h-4 text-current" />
        )}
        <span>{saved ? t('schemeDetails.saved') : t('schemeDetails.saveScheme')}</span>
      </Button>
    );
  }

  // Icon variant for cards
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      title={saved ? t('common.remove') : t('common.save')}
      aria-label={actionLabel}
      className={`p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        saved
          ? "text-saffron bg-saffron/10 hover:bg-saffron/20"
          : "text-muted-foreground hover:text-navy hover:bg-surface-muted dark:hover:text-white"
      } ${className}`}
    >
      {isBusy ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        <Bookmark
          className={`w-4 h-4 transition-transform duration-150 ${
            saved ? "fill-saffron text-saffron scale-110" : ""
          }`}
        />
      )}
    </button>
  );
}
