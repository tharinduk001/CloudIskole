import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/site/user-menu";
import { Container } from "@/components/ui/layout";
import { brand } from "@/lib/brand";
import { requireProfile } from "@/lib/data/auth";

/**
 * Shell for signed-in areas. Calling `requireProfile()` here means every page
 * beneath this layout is authenticated by construction — a new page cannot
 * forget to check.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireProfile();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-teal-600 focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-line bg-surface sticky top-0 z-50 border-b">
        <Container size="wide">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/dashboard"
              aria-label={`${brand.name} dashboard`}
              className="rounded-lg"
            >
              <Logo />
            </Link>
            <UserMenu profile={profile} />
          </div>
        </Container>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
