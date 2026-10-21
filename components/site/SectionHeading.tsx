import Link from 'next/link';

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  copy?: string;
  link?: { label: string; href: string };
  align?: 'center' | 'left';
};

export function SectionHeading({
  eyebrow,
  title,
  copy,
  link,
  align = 'center',
}: SectionHeadingProps) {
  return (
    <div
      className={`section-heading ${
        align === 'left' ? 'items-start text-left' : 'items-center text-center'
      }`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {copy ? <p className="section-copy">{copy}</p> : null}
      {link ? (
        <Link className="under-link" href={link.href}>
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
