import Link from "next/link";

import { Liyawel } from "@/components/brand/liyawel";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-wash relative flex min-h-svh flex-col overflow-hidden">
      <Liyawel className="absolute -top-32 -left-40 size-[36rem] opacity-[0.05]" />
      <Liyawel className="absolute -right-40 -bottom-40 size-[36rem] -scale-x-100 opacity-[0.04]" />

      <header className="relative px-6 py-7">
        <Link
          href="/"
          aria-label={`${brand.name} home`}
          className="inline-block rounded-lg"
        >
          <Logo />
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="text-ink-subtle relative px-6 pb-8 text-center text-xs">
        <Link href="/privacy" className="hover:text-teal-700">
          Privacy
        </Link>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <Link href="/terms" className="hover:text-teal-700">
          Terms
        </Link>
      </footer>
    </div>
  );
}
