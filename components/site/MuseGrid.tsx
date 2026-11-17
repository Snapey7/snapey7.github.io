import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';

type Muse = { slug: string; name: string; image: string; location: string };

export function MuseGrid({ muses }: { muses: readonly Muse[] }) {
  return <section className="model-grid" aria-label="Muse profiles">
    {muses.map(model => <Link className="model-card" href={`/models/${model.slug}`} key={model.slug}>
      <img alt={model.name} src={model.image} />
      <div className="muse-hover-details">
        <span className="muse-unlock"><LockKeyhole aria-hidden="true" /> UNLOCK</span>
        <span className="muse-person">{model.name} | {model.location}</span>
        <span className="muse-meta">GALLERY <i>·</i> IMPURA | EXCLUSIVE PHOTOS</span>
      </div>
    </Link>)}
  </section>;
}
