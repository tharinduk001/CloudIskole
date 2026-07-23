import { Cloud, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import {
  siAnsible,
  siDocker,
  siGit,
  siGithub,
  siGithubactions,
  siGnubash,
  siGooglecloud,
  siGrafana,
  siJenkins,
  siKubernetes,
  siLinux,
  siNginx,
  siPrometheus,
  siPython,
  siTerraform,
  type SimpleIcon,
} from "simple-icons";

/**
 * A grid of square tiles — a Rubik's-cube face rather than yet another
 * scrolling logo strip — each showing one tool's actual brand mark in its
 * actual brand color. Icons come from `simple-icons` (self-hosted SVG path
 * data) so every mark except AWS is the tool's real glyph and color; AWS's
 * usage guidelines keep their logo out of third-party icon packs like this
 * one, so it falls back to a generic cloud glyph tinted terracotta instead
 * of an unauthorised reproduction of their mark.
 */
const TOOLS: { name: string; hex: string; icon: SimpleIcon | LucideIcon }[] = [
  { name: "AWS", hex: "D4564A", icon: Cloud },
  { name: "Docker", hex: siDocker.hex, icon: siDocker },
  { name: "Kubernetes", hex: siKubernetes.hex, icon: siKubernetes },
  { name: "Terraform", hex: siTerraform.hex, icon: siTerraform },
  { name: "Ansible", hex: siAnsible.hex, icon: siAnsible },
  { name: "Jenkins", hex: siJenkins.hex, icon: siJenkins },
  { name: "Linux", hex: siLinux.hex, icon: siLinux },
  { name: "Git", hex: siGit.hex, icon: siGit },
  { name: "GitHub", hex: siGithub.hex, icon: siGithub },
  { name: "GitHub Actions", hex: siGithubactions.hex, icon: siGithubactions },
  { name: "Python", hex: siPython.hex, icon: siPython },
  { name: "Nginx", hex: siNginx.hex, icon: siNginx },
  { name: "Bash", hex: siGnubash.hex, icon: siGnubash },
  { name: "Prometheus", hex: siPrometheus.hex, icon: siPrometheus },
  { name: "Grafana", hex: siGrafana.hex, icon: siGrafana },
  { name: "Google Cloud", hex: siGooglecloud.hex, icon: siGooglecloud },
];

function isSimpleIcon(icon: SimpleIcon | LucideIcon): icon is SimpleIcon {
  return "path" in icon;
}

function Tile({ tool }: { tool: (typeof TOOLS)[number] }) {
  const { icon, name, hex } = tool;
  const LucideMark = isSimpleIcon(icon) ? null : icon;
  const color = `#${hex}`;

  return (
    <div
      className="bg-surface group hover:bg-[var(--tool-tint)] relative flex aspect-square flex-col items-center justify-center gap-2.5 p-4 transition-colors duration-300"
      style={{ "--tool-tint": `${color}14` } as CSSProperties}
    >
      <span
        className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-6 group-hover:scale-110"
        style={{ color }}
      >
        {LucideMark ? (
          <LucideMark className="size-8 sm:size-9" aria-hidden="true" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            role="img"
            aria-hidden="true"
            className="size-8 fill-current sm:size-9"
          >
            <path d={(icon as SimpleIcon).path} />
          </svg>
        )}
      </span>
      <span className="text-mist text-center text-[11px] font-medium tracking-wide sm:text-xs">
        {name}
      </span>
      <span
        className="absolute top-2 right-2 size-1.5 rounded-full opacity-70"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
    </div>
  );
}

export function TechCubeGrid() {
  return (
    <div
      className="border-hairline grid grid-cols-3 gap-px overflow-hidden border bg-[var(--color-hairline)] sm:grid-cols-4"
      role="img"
      aria-label={`Tools covered across bootcamps: ${TOOLS.map((t) => t.name).join(", ")}`}
    >
      {TOOLS.map((tool) => (
        <Tile key={tool.name} tool={tool} />
      ))}
    </div>
  );
}
