'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navItems } from '@/lib/content';
import { destinationNavItems } from '@/lib/destinations';

export function Header() {
  const [open, setOpen] = useState(false);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition duration-500 ${
        scrolled || open
          ? 'border-b border-coral/20 bg-black/78 backdrop-blur-xl'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center px-5 md:px-8 lg:px-10">
        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => item.label === 'DESTINATIONS' ? (
            <div className="nav-dropdown" key={item.label}>
              <Link className="nav-link" href={item.href}>
                {item.label}
              </Link>
              <div className="nav-dropdown-menu">
                {destinationNavItems.map((destination) => (
                  <Link href={destination.href} key={destination.name}>
                    {destination.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link className="nav-link" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="inline-flex h-10 w-10 items-center justify-center border border-coral/30 text-coral lg:hidden"
          onClick={() => {
            setOpen((value) => !value);
            setDestinationsOpen(false);
          }}
          type="button"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>

        <Link
          aria-label="IMPURA VIDA home"
          className="relative h-14 w-36 sm:w-44 lg:w-52"
          href="/"
        >
          <Image
            alt="IMPURA VIDA Magazine"
            className="object-contain"
            fill
            priority
            src="/assets/impura-vida-logo.png"
            sizes="220px"
          />
        </Link>

        <nav className="hidden items-center justify-end gap-7 lg:flex">
          <Link className="nav-link nav-link-accent" href="/members">
            SUBSCRIBE
          </Link>
          <Link className="nav-link" href="/login">
            LOGIN
          </Link>
        </nav>

        <Link
          className="justify-self-end text-[10px] font-semibold tracking-[0.2em] text-coral lg:hidden"
          href="/members"
        >
          JOIN
        </Link>
      </div>

      <div
        className={`border-t border-coral/15 transition-[max-height,opacity] duration-500 lg:hidden ${
          open
            ? 'max-h-[calc(100dvh-5rem)] overflow-y-auto opacity-100'
            : 'max-h-0 overflow-hidden opacity-0'
        }`}
      >
        <nav className="grid gap-1 bg-black/96 px-5 py-5">
          {navItems.map((item) => (
            <div className="mobile-nav-item" key={item.label}>
              {item.label === 'DESTINATIONS' ? (
                <button
                  aria-expanded={destinationsOpen}
                  className="mobile-destinations-toggle"
                  onClick={() => setDestinationsOpen((value) => !value)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${destinationsOpen ? 'rotate-180' : ''}`}
                    size={16}
                  />
                </button>
              ) : (
                <Link
                  className="border-b border-white/8 py-3 text-xs font-semibold tracking-[0.22em] text-ivory/85"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              )}
              {item.label === 'DESTINATIONS' && destinationsOpen && (
                <>
                  <Link className="mobile-nav-subitem" href={item.href} onClick={() => setOpen(false)}>
                    All destinations
                  </Link>
                  {destinationNavItems.map((destination) => (
                    <Link
                      className="mobile-nav-subitem"
                      href={destination.href}
                      key={destination.name}
                      onClick={() => setOpen(false)}
                    >
                      {destination.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          ))}
          <Link
            className="mt-3 border border-coral/50 px-4 py-4 text-center text-xs font-semibold tracking-[0.22em] text-coral"
            href="/login"
            onClick={() => setOpen(false)}
          >
            MEMBER LOGIN
          </Link>
        </nav>
      </div>
    </header>
  );
}
