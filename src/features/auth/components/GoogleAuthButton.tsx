import type { ReactNode } from "react";
import { GOOGLE_CLIENT_ID } from "../constants/auth";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { GoogleIcon } from "../../../shared/ui/icons/services";
import type { GoogleAuthMode } from "../types/auth";
import { Button } from "../../../shared/ui/Button";
import { Spinner } from "../../../shared/ui/Spinner";
import { cn } from "../../../shared/lib/cn";

interface GoogleAuthButtonProps {
  mode?: GoogleAuthMode;
  disabled?: boolean;
  linked?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onLinked?: () => void;
  children?: ReactNode;
  showDivider?: boolean;
  shape?: "pill" | "rounded";
}

export function GoogleAuthButton({
  mode = "signin",
  disabled = false,
  linked = false,
  children,
  showDivider = true,
  shape = "pill",
  onBusyChange,
  onLinked,
}: GoogleAuthButtonProps) {
  const { buttonRef, isBusy, error, isLoading } = useGoogleAuth({
    mode,
    disabled,
    linked,
    onBusyChange,
    onLinked,
  });
  const unavailable =
    !GOOGLE_CLIENT_ID || disabled || linked || isLoading || isBusy;
  return (
    <div className={cn("space-y-3", mode !== "link" && showDivider && "mb-5")}>
      <div
        className={cn(mode === "link" && "flex flex-wrap items-center gap-3")}
      >
        <div className={cn(
          "relative overflow-hidden focus-within:ring-2 focus-within:ring-ring",
          mode === "link" ? "size-10" : "h-12 w-full",
          shape === "pill" ? "rounded-full" : "rounded-sm",
        )}>
        <Button
          type="button"
          variant="outline"
          size={mode === "link" ? "icon" : "lg"}
          shape={shape}
          fullWidth={mode !== "link"}
          disabled={
            Boolean(GOOGLE_CLIENT_ID) &&
            (disabled || linked || isLoading || isBusy)
          }
          aria-disabled={unavailable}
          aria-busy={isBusy}
          aria-hidden={GOOGLE_CLIENT_ID ? true : undefined}
          tabIndex={GOOGLE_CLIENT_ID ? -1 : undefined}
          aria-label={mode === "link" ? "Продовжити з Google" : undefined}
          title={
            !GOOGLE_CLIENT_ID ? "Вхід через Google не налаштовано." : undefined
          }
          className={cn(
            "gap-3 bg-background",
            GOOGLE_CLIENT_ID && "pointer-events-none",
            unavailable ? "cursor-default" : "cursor-pointer",
          )}
        >
          <GoogleIcon className="size-5 shrink-0" />
          {mode !== "link" && (
            <span className="whitespace-normal text-center">
              {mode === "signup"
                ? "Зареєструватися через Google"
                : "Вхід через Google"}
            </span>
          )}
        </Button>
        {GOOGLE_CLIENT_ID && <div
          ref={buttonRef}
          inert={disabled || linked || isLoading || isBusy}
          className="absolute top-0 left-0 h-11 w-[400px] origin-top-left opacity-0"
        />}
        </div>
        {children}
      </div>
      {isBusy && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Spinner variant="inline" className="size-4" />
          Перехід до Google…
        </p>
      )}
      {linked && (
        <p role="status" className="text-sm text-primary">
          Google успішно прив’язано.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {mode !== "link" && showDivider && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          або
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
    </div>
  );
}
