/**
 * Continuous strip of the tools courses actually teach — the marketing
 * equivalent of zuucrew's "industry-grade tools" band. Duplicated once so
 * the CSS marquee (globals.css `.animate-marquee`) can loop seamlessly at
 * the halfway translateX(-50%) mark.
 */
const TOOLS = [
  "AWS",
  "Docker",
  "Kubernetes",
  "Linux",
  "Git & GitHub",
  "Python",
  "GitHub Actions",
  "Terraform",
  "Bash",
  "Nginx",
];

export function ToolMarquee() {
  return (
    <div
      className="border-hairline relative overflow-hidden border-y py-6"
      role="img"
      aria-label={`Tools covered across bootcamps: ${TOOLS.join(", ")}`}
    >
      <div className="animate-marquee flex w-max items-center gap-10" aria-hidden="true">
        {[...TOOLS, ...TOOLS].map((tool, i) => (
          <span
            key={`${tool}-${i}`}
            className="font-display text-onyx-soft/40 text-2xl font-semibold tracking-tight whitespace-nowrap sm:text-3xl"
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}
