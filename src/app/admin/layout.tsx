import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/ui/layout";
import { requireAdmin } from "@/lib/data/auth";

/**
 * Shell for `/admin/*`. `requireAdmin()` re-reads the role from the database
 * on every request — never from a cookie or a client-supplied value — and
 * redirects a non-admin to `/dashboard` without revealing this route exists.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="bg-wash min-h-screen">
      <AdminNav />
      <div className="lg:pl-64">
        <main id="main" className="py-8">
          <Container size="wide">{children}</Container>
        </main>
      </div>
    </div>
  );
}
