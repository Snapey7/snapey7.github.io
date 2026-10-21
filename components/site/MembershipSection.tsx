import Image from 'next/image';
import { BadgeCheck, Eye, Film, Images, MessageCircle, Shell } from 'lucide-react';
import { membershipTiers } from '@/lib/content';
import { SectionHeading } from './SectionHeading';

const icons = [Shell, Eye, MessageCircle, Images, Film];

export function MembershipSection() {
  return (
    <section className="membership-section" id="membership">
      <SectionHeading
        copy="It's best enjoyed by someone just like you. Cancel anytime."
        eyebrow="CHOOSE YOUR TIER"
        title="Join The Experience"
      />

      <div className="membership-grid">
        {membershipTiers.map((tier) => (
          <article
            className={`membership-card ${tier.featured ? 'is-featured' : ''}`}
            key={tier.name}
          >
            {tier.badge ? <span className="popular-badge">{tier.badge}</span> : null}
            <Image
              alt=""
              className="object-cover opacity-55"
              fill
              src={tier.image}
              sizes="(min-width: 900px) 42vw, 100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),rgba(0,0,0,0.78)_42%,rgba(0,0,0,0.9))]" />
            <div className="relative z-10 flex h-full flex-col">
              <BadgeCheck className="mx-auto mb-5 text-coral" size={48} strokeWidth={1} />
              <h3>{tier.name}</h3>
              <div className="ornament" />
              <ul>
                {tier.benefits.map((benefit, index) => {
                  const Icon = icons[index] ?? Shell;
                  return (
                    <li key={benefit}>
                      <Icon size={15} />
                      <span>{benefit}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto space-y-3">
                <a className={`buy-button ${tier.featured ? 'featured' : ''}`} href="/members">
                  BUY NOW · {'$'}
                  {tier.price}
                </a>
                <a className="annual-button" href="/members">
                  SAVE 17% · SIGN UP FOR ANNUAL NOW
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
