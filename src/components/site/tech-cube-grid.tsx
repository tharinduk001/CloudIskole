import { Cloud, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import {
  siAnsible,
  siArgo,
  siChef,
  siConsul,
  siDigitalocean,
  siDocker,
  siGit,
  siGithub,
  siGithubactions,
  siGitlab,
  siGnubash,
  siGooglecloud,
  siGrafana,
  siHelm,
  siIstio,
  siJenkins,
  siKubernetes,
  siLinux,
  siMongodb,
  siMysql,
  siNginx,
  siNodedotjs,
  siPacker,
  siPostgresql,
  siPrometheus,
  siPuppet,
  siPython,
  siRabbitmq,
  siRedis,
  siTerraform,
  siVault,
  type SimpleIcon,
} from "simple-icons";

/**
 * A dense wall of small square tiles — a Rubik's-cube face rather than yet
 * another scrolling logo strip — each showing one tool's real brand mark in
 * its real brand color. Icons come from `simple-icons` (self-hosted SVG path
 * data) so every mark except AWS is the tool's actual glyph and color; AWS's
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
  { name: "GitLab", hex: siGitlab.hex, icon: siGitlab },
  { name: "Python", hex: siPython.hex, icon: siPython },
  { name: "Nginx", hex: siNginx.hex, icon: siNginx },
  { name: "Bash", hex: siGnubash.hex, icon: siGnubash },
  { name: "Prometheus", hex: siPrometheus.hex, icon: siPrometheus },
  { name: "Grafana", hex: siGrafana.hex, icon: siGrafana },
  { name: "Google Cloud", hex: siGooglecloud.hex, icon: siGooglecloud },
  { name: "Helm", hex: siHelm.hex, icon: siHelm },
  { name: "Vault", hex: siVault.hex, icon: siVault },
  { name: "Consul", hex: siConsul.hex, icon: siConsul },
  { name: "Argo", hex: siArgo.hex, icon: siArgo },
  { name: "Istio", hex: siIstio.hex, icon: siIstio },
  { name: "Chef", hex: siChef.hex, icon: siChef },
  { name: "Puppet", hex: siPuppet.hex, icon: siPuppet },
  { name: "PostgreSQL", hex: siPostgresql.hex, icon: siPostgresql },
  { name: "MySQL", hex: siMysql.hex, icon: siMysql },
  { name: "Redis", hex: siRedis.hex, icon: siRedis },
  { name: "MongoDB", hex: siMongodb.hex, icon: siMongodb },
  { name: "RabbitMQ", hex: siRabbitmq.hex, icon: siRabbitmq },
  { name: "Node.js", hex: siNodedotjs.hex, icon: siNodedotjs },
  { name: "DigitalOcean", hex: siDigitalocean.hex, icon: siDigitalocean },
  { name: "Packer", hex: siPacker.hex, icon: siPacker },
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
      title={name}
      className="bg-surface group hover:bg-[var(--tool-tint)] relative flex aspect-square items-center justify-center p-2 transition-colors duration-200"
      style={{ "--tool-tint": `${color}14` } as CSSProperties}
    >
      <span
        className="transition-transform duration-200 ease-out group-hover:scale-110"
        style={{ color }}
      >
        {LucideMark ? (
          <LucideMark className="size-4" aria-hidden="true" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            role="img"
            aria-hidden="true"
            className="size-4 fill-current"
          >
            <path d={(icon as SimpleIcon).path} />
          </svg>
        )}
      </span>
      <span className="sr-only">{name}</span>
    </div>
  );
}

export function TechCubeGrid() {
  return (
    <div
      className="border-hairline mx-auto grid max-w-sm grid-cols-[repeat(auto-fit,minmax(44px,1fr))] gap-px overflow-hidden border bg-[var(--color-hairline)]"
      role="img"
      aria-label={`Tools covered across bootcamps: ${TOOLS.map((t) => t.name).join(", ")}`}
    >
      {TOOLS.map((tool) => (
        <Tile key={tool.name} tool={tool} />
      ))}
    </div>
  );
}
