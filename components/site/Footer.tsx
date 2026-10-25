import Image from 'next/image';
import Link from 'next/link';
import { navItems } from '@/lib/content';

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
      </div>
    </footer>
  );
}
