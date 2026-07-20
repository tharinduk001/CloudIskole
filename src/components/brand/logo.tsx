import Image from "next/image";

import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/** The icon-only mark, cropped tight from the full lockup artwork. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/favikon.png"
      alt={`${brand.name} logo`}
      width={260}
      height={257}
      priority
      className={cn("size-9 object-contain", className)}
    />
  );
}

/** Mark plus wordmark. Used in the header, footer and auth screens. */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  if (!showWordmark) {
    return <LogoMark className={className} />;
  }

  return (
    <Image
      src="/logo/logo-cropped.png"
      alt={brand.name}
      width={868}
      height={220}
      priority
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
