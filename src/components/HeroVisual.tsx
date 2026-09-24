import Image from "next/image";

export function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="spot" aria-hidden />
      <div className="hero-figure" role="img" aria-label="Michelangelo's David — the ideal of masculine form">
        <Image
          className="hero-photo"
          src="/img/hero-david.jpg"
          alt="Michelangelo's David — the ideal of masculine form"
          fill
          sizes="(max-width: 768px) 100vw, 46vw"
          priority
        />
        <span className="hero-shade" aria-hidden />
      </div>
      <div className="hero-rim" aria-hidden />
      <span className="hero-gold-label">STANDARD · DISCIPLINE · CONTINUITY</span>
    </div>
  );
}