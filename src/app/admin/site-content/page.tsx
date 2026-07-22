import type { Metadata } from "next";

import { FounderCertificationsManager } from "@/components/admin/founder-certifications-manager";
import { FounderEducationManager } from "@/components/admin/founder-education-manager";
import { FounderExperienceManager } from "@/components/admin/founder-experience-manager";
import { FounderProfileForm } from "@/components/admin/founder-profile-form";
import { HighlightsManager } from "@/components/admin/highlights-manager";
import { PartnersManager } from "@/components/admin/partners-manager";
import { getFounderProfile, getHighlights, getPartners } from "@/lib/data/site-content";

export const metadata: Metadata = { title: "Site content" };

export default async function AdminSiteContentPage() {
  const [partners, highlights, founder] = await Promise.all([
    getPartners(),
    getHighlights(),
    getFounderProfile(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Site content</h1>
        <p className="text-ink-muted mt-1 text-sm">
          The home page partners strip, moments photo grid, and the about page founder
          bio.
        </p>
      </div>

      <PartnersManager partners={partners} />
      <HighlightsManager highlights={highlights} />
      <FounderProfileForm profile={founder} />
      <FounderEducationManager entries={founder.education} />
      <FounderExperienceManager entries={founder.experience} />
      <FounderCertificationsManager certifications={founder.certifications} />
    </div>
  );
}
