import { LogOut, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/lib/data/auth";

/** Initials fallback when a student has no Google avatar. */
function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function UserMenu({ profile }: { profile: Profile }) {
  const displayName = profile.full_name || profile.email.split("@")[0] || "Student";

  return (
    <div className="flex items-center gap-3">
      {profile.role === "admin" ? (
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/admin">
            <ShieldCheck aria-hidden="true" />
            Admin
          </Link>
        </Button>
      ) : null}

      <Link
        href="/profile"
        className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-teal-50"
      >
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
            // Google's avatar host is allow-listed in next.config.ts.
            unoptimized
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-teal-600 text-xs font-semibold text-white"
          >
            {initials(profile.full_name, profile.email)}
          </span>
        )}
        <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
      </Link>

      {profile.role === "admin" ? (
        <Badge variant="teal" size="sm" className="hidden lg:inline-flex">
          Admin
        </Badge>
      ) : null}

      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
          <LogOut aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
