import type { Metadata } from "next";

import { CertificateRowActions } from "@/components/admin/certificate-row-actions";
import { Card } from "@/components/ui/card";
import { listCertificatesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Certificates" };

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminCertificatesPage() {
  const certificates = await listCertificatesAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Certificates</h1>
      <p className="text-ink-muted mt-1 text-sm">
        Issued automatically when a student finishes a course. Record an external digital badge
        URL here once issued on the provider&rsquo;s side.
      </p>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">External badge</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td className="px-4 py-3">
                  <div className="text-ink font-medium">{cert.student.full_name}</div>
                  <div className="text-ink-subtle text-xs">{cert.student.email}</div>
                </td>
                <td className="text-ink-muted px-4 py-3">{cert.course.title}</td>
                <td className="text-ink-muted px-4 py-3 font-mono text-xs">{cert.code}</td>
                <td className="text-ink-muted px-4 py-3">{dateFormatter.format(new Date(cert.issued_at))}</td>
                <td className="px-4 py-3">
                  <CertificateRowActions
                    certificateId={cert.id}
                    revoked={cert.revoked_at !== null}
                    externalBadgeUrl={cert.external_badge_url}
                  />
                </td>
              </tr>
            ))}
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-ink-muted px-4 py-8 text-center">
                  No certificates issued yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
