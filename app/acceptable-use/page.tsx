import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Acceptable Use Policy' };

export default function AcceptableUsePage() {
  return (
    <PolicyPage
      title="Acceptable Use Policy"
      intro="A few basic rules help keep Impura Vida Magazine safe and respectful."
    >
      <PolicySection title="Use content responsibly">
        <p>You must be 18 or older to use paid areas. Do not upload or share material without the necessary rights and consent. Content involving minors, non-consensual intimate material, or unlawful content is prohibited.</p>
      </PolicySection>
      <PolicySection title="Respect access and other people">
        <p>Do not share paid content or account access, bypass payment or security controls, interfere with the site, or use it to harass, threaten, defraud or harm others. Contact <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a> to report a concern. We may restrict access or remove content when reasonably needed to address misuse or legal requirements.</p>
      </PolicySection>
    </PolicyPage>
  );
}
