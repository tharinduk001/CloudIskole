import { Award } from "lucide-react";
import type { Metadata } from "next";

import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { requireProfile } from "@/lib/data/auth";
import { getMyGamification } from "@/lib/data/gamification";

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
  const gamification = await getMyGamification(profile.id);

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
                  <span className="bg-gold-50 grid size-12 shrink-0 place-items-center rounded-xl text-2xl">
                    {badge.icon ?? (
                      <Award className="text-gold-700 size-5" aria-hidden="true" />
                    )}
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
      </Container>
    </Section>
  );
}
