import { Liyawel } from "@/components/brand/liyawel";
import { Container } from "@/components/ui/layout";

/** Shared hero band for interior pages, so they share one rhythm. */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="bg-wash border-line relative overflow-hidden border-b">
      <Liyawel className="absolute -top-20 -right-24 size-96 opacity-[0.05]" />
      <Container size="wide" className="relative py-16 sm:py-20">
        <div className="max-w-3xl">
          {eyebrow ? (
            <span className="text-gold-700 text-xs font-semibold tracking-[0.14em] uppercase">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-display mt-3 text-4xl leading-[1.1] sm:text-5xl">{title}</h1>
          {description ? (
            <p className="text-ink-muted mt-5 text-lg leading-relaxed">{description}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
