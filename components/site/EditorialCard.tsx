import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { editorials } from '@/lib/content';

type Editorial = (typeof editorials)[number];

export function EditorialCard({
  editorial,
  captioned = false,
}: {
  editorial: Editorial;
  captioned?: boolean;
}) {
  const displayTitle = editorial.title
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <Link
      className={`editorial-card group${captioned ? ' editorial-card-captioned' : ''}`}
      href={`/editorials/${editorial.slug}`}
    >
      <div className="editorial-card-media relative h-full overflow-hidden">
        <Image
          alt={editorial.title}
          className="object-cover transition duration-700 group-hover:scale-[1.045]"
          fill
          src={editorial.image}
          style={
            captioned && editorial.slug === 'alexis-noir'
              ? { objectPosition: 'center 50%' }
              : captioned &&
            ['monica-riviera', 'willow', 'isabella'].includes(
              editorial.slug,
            )
              ? { objectPosition: 'center 10%' }
              : undefined
          }
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/82" />
        <div className="absolute inset-0 border border-white/10 transition duration-500 group-hover:border-coral/45 group-hover:shadow-[0_0_28px_rgba(255,99,105,0.16)]" />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.16em] text-coral">
          <BookOpen aria-hidden="true" size={11} />
          GALLERY
        </div>
      </div>
      {captioned && (
        <div className="editorial-card-caption">
          <h3>{displayTitle}</h3>
          <p>{captioned ? editorial.cardDescription : editorial.intro}</p>
          <span>Impura Vida</span>
        </div>
      )}
      {!captioned && (
        <div className="absolute inset-x-0 bottom-0 translate-y-0 px-5 pb-5 text-center transition duration-500 group-hover:-translate-y-1">
          <h3 className="font-serif text-[1.03rem] uppercase tracking-[0.03em] text-ivory">
            {editorial.title}
          </h3>
        </div>
      )}
    </Link>
  );
}
