import type { Metadata } from "next";

import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { requireProfile } from "@/lib/data/auth";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const profile = await requireProfile("/profile");

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
      </Container>
    </Section>
  );
}
