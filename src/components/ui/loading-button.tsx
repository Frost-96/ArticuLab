import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  loadingIcon?: React.ReactNode;
};

export function LoadingButton({
  children,
  disabled,
  isLoading = false,
  loadingText,
  loadingIcon,
  ...props
}: LoadingButtonProps) {
  const hasLoadingText = loadingText !== undefined && loadingText !== "";

  return (
    <Button
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          {loadingIcon ?? <Loader2 className="animate-spin" />}
          {hasLoadingText ? loadingText : loadingText === "" ? null : children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
