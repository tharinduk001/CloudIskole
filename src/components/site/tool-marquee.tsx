import { Cloud, type LucideIcon } from "lucide-react";
import {
  siDocker,
  siGit,
  siGithub,
  siGithubactions,
  siGnubash,
  siKubernetes,
  siLinux,
  siNginx,
  siPython,
  siTerraform,
  type SimpleIcon,
} from "simple-icons";

/**
 * Continuous strip of the tools courses actually teach — the marketing
 * equivalent of zuucrew's "industry-grade tools" band. Duplicated once so
 * the CSS marquee (globals.css `.animate-marquee`) can loop seamlessly at
 * the halfway translateX(-50%) mark.
 *
 * Icons come from `simple-icons` (self-hosted SVG path data, no network
 * request per logo) rather than a generic icon font, so each mark is the
 * tool's actual brand glyph. AWS is the one exception — Amazon's usage
 * guidelines keep their logo out of third-party icon packs like this one,
 * so it falls back to a generic cloud glyph from lucide-react instead of an
 * unauthorised reproduction of their mark.
 */
const TOOLS: { name: string; icon: SimpleIcon | LucideIcon }[] = [
  { name: "AWS", icon: Cloud },
  { name: "Docker", icon: siDocker },
  { name: "Kubernetes", icon: siKubernetes },
  { name: "Linux", icon: siLinux },
  { name: "Git", icon: siGit },
  { name: "GitHub", icon: siGithub },
  { name: "Python", icon: siPython },
  { name: "GitHub Actions", icon: siGithubactions },
  { name: "Terraform", icon: siTerraform },
  { name: "Bash", icon: siGnubash },
  { name: "Nginx", icon: siNginx },
];

function isSimpleIcon(icon: SimpleIcon | LucideIcon): icon is SimpleIcon {
  return "path" in icon;
}

function ToolMark({ tool }: { tool: (typeof TOOLS)[number] }) {
  const { icon, name } = tool;
  const LucideMark = isSimpleIcon(icon) ? null : icon;

  return (
    <span className="text-onyx-soft/50 flex shrink-0 items-center gap-3 whitespace-nowrap">
      {LucideMark ? (
        <LucideMark className="size-7 shrink-0 sm:size-8" aria-hidden="true" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          role="img"
          aria-hidden="true"
          className="size-7 shrink-0 fill-current sm:size-8"
        >
          <path d={(icon as SimpleIcon).path} />
        </svg>
      )}
      <span className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {name}
      </span>
    </span>
  );
}

export function ToolMarquee() {
  return (
    <div
      className="border-hairline relative overflow-hidden border-y py-6"
      role="img"
      aria-label={`Tools covered across bootcamps: ${TOOLS.map((t) => t.name).join(", ")}`}
    >
      <div className="animate-marquee flex w-max items-center gap-12" aria-hidden="true">
        {[...TOOLS, ...TOOLS].map((tool, i) => (
          <ToolMark key={`${tool.name}-${i}`} tool={tool} />
        ))}
      </div>
    </div>
  );
}
