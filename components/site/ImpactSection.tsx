import Link from 'next/link';
import { Leaf, Palmtree, Turtle, Waves } from 'lucide-react';
import { impactStats } from '@/lib/content';

const statIcons = {
  turtle: Turtle,
  palm: Palmtree,
  wave: Waves,
  leaf: Leaf,
};

export function ImpactSection() {
  return (
    <section className="impact-section">
      <img
        alt="Moonlit Costa Rican conservation beach"
        className="absolute inset-0 h-full w-full object-cover"
        src="/assets/section-4-background.png"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.38),rgba(0,0,0,0.76)_36%,rgba(0,0,0,0.58)_66%,rgba(0,0,0,0.18)),radial-gradient(circle_at_center,rgba(0,0,0,0.05),rgba(0,0,0,0.74)_78%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 text-center">
        <p className="eyebrow">OUR IMPACT</p>
        <h2>PROTECTING PARADISE</h2>
        <p className="impact-subhead">
          EVERY MEMBERSHIP HELPS PROTECT COSTA RICA'S SEA TURTLES.
        </p>
        <p className="impact-copy">
          From the beaches of Santa Teresa to the nesting grounds of Ostional,
          sea turtles have returned to Costa Rica's shores for millions of years.
          Every Impura Vida membership contributes to local conservation efforts
          protecting nesting sites, hatchlings and critical coastal habitats.
        </p>
        <div className="impact-divider" />

        <div className="impact-stats">
          {impactStats.map((stat) => {
            const Icon = statIcons[stat.icon as keyof typeof statIcons];
            return (
              <div className="impact-stat" key={stat.label}>
                <Icon size={42} strokeWidth={1.15} />
                <strong>
                  {'prefix' in stat ? stat.prefix : ''}
                  {stat.value}
                </strong>
                <span>{stat.label}</span>
              </div>
            );
          })}
        </div>

        <h3>PARADISE IS WORTH PROTECTING</h3>
        <p className="impact-copy lower">
          The landscapes that inspire every edition deserve protection. Every
          membership helps preserve Costa Rica's coastline and protect vulnerable
          sea turtle populations for future generations.
        </p>
        <Link className="solid-cta" href="/members">
          JOIN THE EXPERIENCE <span aria-hidden="true">-&gt;</span>
        </Link>
        <p className="impact-foot">LUXURY CONTENT. REAL-WORLD IMPACT.</p>
      </div>
    </section>
  );
}
