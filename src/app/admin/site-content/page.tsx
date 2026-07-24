import type { Metadata } from "next";

import { AdminTabs } from "@/components/admin/admin-tabs";
import { FounderCertificationsManager } from "@/components/admin/founder-certifications-manager";
import { FounderEducationManager } from "@/components/admin/founder-education-manager";
import { FounderExperienceManager } from "@/components/admin/founder-experience-manager";
import { FounderProfileForm } from "@/components/admin/founder-profile-form";
import { HighlightsManager } from "@/components/admin/highlights-manager";
import { PartnersManager } from "@/components/admin/partners-manager";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";
import {
  getFounderProfile,
  getHighlights,
  getPartners,
  getTestimonials,
} from "@/lib/data/site-content";

export const metadata: Metadata = { title: "Site content" };

export default async function AdminSiteContentPage() {
  const [partners, highlights, testimonials, founder] = await Promise.all([
    getPartners(),
    getHighlights(),
    getTestimonials(),
    getFounderProfile(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Site content</h1>
        <p className="text-ink-muted mt-1 text-sm">
          The home page partners strip, moments photo grid, student reviews widget, and
          the about page founder bio.
        </p>
      </div>

      <AdminTabs
        sections={[
          {
            id: "partners",
            label: "Partners",
            content: <PartnersManager partners={partners} />,
          },
          {
            id: "highlights",
            label: "Moments photos",
            content: <HighlightsManager highlights={highlights} />,
          },
          {
            id: "testimonials",
            label: "Student reviews",
            content: <TestimonialsManager testimonials={testimonials} />,
          },
          {
            id: "founder-profile",
            label: "Founder profile",
            content: <FounderProfileForm profile={founder} />,
          },
          {
            id: "founder-education",
            label: "Education",
            content: <FounderEducationManager entries={founder.education} />,
          },
          {
            id: "founder-experience",
            label: "Experience",
            content: <FounderExperienceManager entries={founder.experience} />,
          },
          {
            id: "founder-certifications",
            label: "Certifications",
            content: (
              <FounderCertificationsManager certifications={founder.certifications} />
            ),
          },
        ]}
      />
    </div>
  );
}
