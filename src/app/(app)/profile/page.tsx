import { Award, FileBadge2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { requireProfile } from "@/lib/data/auth";
import { getMyGamification, listMyCertificates } from "@/lib/data/gamification";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function ProfilePage() {
  const profile = await requireProfile("/profile");
  const [gamification, certificates] = await Promise.all([
    getMyGamification(profile.id),
    listMyCertificates(profile.id),
  ]);

  return (
    <Section className="py-12">
      <Container size="narrow">
        <h1 className="font-display text-3xl">Your profile</h1>
        <p className="text-ink-muted mt-2 text-sm">
          Update your details. Changes to your leaderboard visibility apply immediately.
        </p>

        <Card className="mt-8 p-6 sm:p-8">
          <AvatarUploader
            userId={profile.id}
            fullName={profile.full_name || profile.email}
            currentAvatarUrl={profile.avatar_url}
          />

          <div className="mt-8">
            <ProfileForm profile={profile} />
          </div>
        </Card>

        <div id="badges" className="mt-10 scroll-mt-20">
          <h2 className="font-display text-lg font-semibold">Badges</h2>
          {gamification.badges.length === 0 ? (
            <p className="text-ink-muted mt-3 text-sm">
              No badges yet — finish a course or build a streak to earn your first one.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {gamification.badges.map(({ badge, awarded_at }) => (
                <Card key={badge.id} className="flex items-center gap-4 p-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold-50 text-2xl">
                    {badge.icon ?? <Award className="size-5 text-gold-700" aria-hidden="true" />}
                  </span>
                  <div>
                    <p className="text-ink text-sm font-semibold">{badge.name}</p>
                    {badge.description ? (
                      <p className="text-ink-muted text-xs">{badge.description}</p>
                    ) : null}
                    <p className="text-ink-subtle mt-1 text-xs">
                      Earned {dateFormatter.format(new Date(awarded_at))}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold">Certificates</h2>
          {certificates.length === 0 ? (
            <p className="text-ink-muted mt-3 text-sm">
              Complete a course to earn a verifiable certificate.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {certificates.map((cert) => (
                <Link key={cert.id} href={`/certificates/${cert.code}`}>
                  <Card interactive className="flex items-center gap-4 p-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                      <FileBadge2 className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-sm font-semibold">{cert.course.title}</p>
                      <p className="text-ink-subtle text-xs">
                        {cert.revoked_at ? "Revoked" : `Issued ${dateFormatter.format(new Date(cert.issued_at))}`}
                        {" · "}
                        {cert.code}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
