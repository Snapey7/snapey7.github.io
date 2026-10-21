import Link from 'next/link';

export function Hero() {
  return (
    <section className="hero-section">
      <div className="absolute inset-0">
        <img
          alt="Nocturnal Costa Rican jungle pool with firelight"
          className="h-full w-full object-cover object-[62%_50%]"
          src="/assets/hero.png"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_66%_38%,transparent_0,rgba(0,0,0,0.1)_28%,rgba(0,0,0,0.58)_78%),linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.52)_32%,rgba(0,0,0,0.08)_68%,rgba(0,0,0,0.58)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="hero-copy reveal">
        <p className="eyebrow">PARADISE AFTER DARK</p>
        <h1>
          IMPURA
          <br />
          VIDA
        </h1>
        <span className="title-rule" />
        <p className="hero-subcopy">
          A DIGITAL MAGAZINE CELEBRATING FREEDOM, BEAUTY, AND TEMPTATION IN
          COSTA RICA AND BEYOND.
        </p>
        <Link className="outline-cta" href="/editorials">
          ENTER THE EXPERIENCE <span aria-hidden="true">-&gt;</span>
        </Link>
      </div>

      <div className="scroll-indicator" aria-hidden="true">
        <span>SCROLL</span>
        <i />
      </div>
    </section>
  );
}
