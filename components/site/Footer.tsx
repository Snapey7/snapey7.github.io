import Image from 'next/image';
import Link from 'next/link';
import { navItems } from '@/lib/content';

const legalLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund-cancellation', label: 'Refund & Cancellation Policy' },
  { href: '/acceptable-use', label: 'Acceptable Use Policy' },
];

export function Footer() {
  return (
    <footer className="border-t border-coral/15 bg-black px-5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
        <Link className="relative h-16 w-48" href="/">
          <Image
            alt="IMPURA VIDA Magazine"
            className="object-contain"
            fill
            src="/assets/impura-vida-logo.png"
            sizes="200px"
          />
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {navItems.map((item) => (
            <Link className="nav-link" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="max-w-xl text-xs leading-6 tracking-[0.18em] text-ivory/45">
          A PRIVATE DIGITAL WORLD BY BEN LUKE SNAPE AND INSPIRED BY COSTA RICA AFTER DARK
        </p>
        <div className="flex w-full flex-col items-center justify-between gap-6 border-t border-ivory/10 pt-6 text-left sm:flex-row sm:items-start">
          <div className="flex flex-col gap-3 text-xs text-ivory/55">
            <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-3 sm:justify-start">
              {legalLinks.map((item) => (
                <Link className="transition-colors hover:text-coral" href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <a className="text-center transition-colors hover:text-coral sm:text-left" href="mailto:impuravidamag@gmail.com">
              impuravidamag@gmail.com
            </a>
            <p className="m-0 text-center sm:text-left">© 2026 ImpuraVidaMagazine.com</p>
          </div>
          <a
            aria-label="Visit Impura Vida Magazine on Instagram"
            className="text-ivory/55 transition-colors hover:text-coral"
            href="https://www.instagram.com/impuravidamag/"
            rel="noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
              <rect height="17" rx="5" stroke="currentColor" strokeWidth="1.8" width="17" x="3.5" y="3.5" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="17.6" cy="6.7" fill="currentColor" r="1.1" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
