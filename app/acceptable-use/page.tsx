import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Acceptable Use Policy' };

export default function AcceptableUsePage() {
  return (
    <PolicyPage
      title="Acceptable Use Policy"
      intro="We want Impura Vida Magazine to be a respectful, lawful and secure place to enjoy editorial photography and member content. This policy applies to everyone using the website, accounts, memberships and shop."
    >
      <PolicySection title="1. Adults and consent">
        <p>You must be 18 or older to use paid member areas or purchase content. Content involving anyone under 18, or content that sexualises a minor, is strictly prohibited. Content must be created and shared with the informed consent of the people depicted. Non-consensual, secretly recorded, intimate or unlawfully shared material is not allowed.</p>
      </PolicySection>
      <PolicySection title="2. Rights in content">
        <p>Do not upload, publish, sell or share material unless you own it or have permission to use it. Do not infringe copyright, trademarks, privacy, publicity or other rights. Do not present another creator’s work as your own or remove attribution and rights notices.</p>
      </PolicySection>
      <PolicySection title="3. Respectful and lawful conduct">
        <p>Do not use the site to threaten, harass, exploit, defame or discriminate against anyone; distribute unlawful material; promote violence or self-harm; commit fraud; or encourage another person to break the law. Do not use the site to advertise or facilitate illegal goods or services.</p>
      </PolicySection>
      <PolicySection title="4. Protecting accounts and paid content">
        <p>Do not share login credentials, bypass payment or access controls, attempt to access another person’s account, scrape or bulk-download the site, redistribute paid images or text, or use content to train or operate a dataset or commercial service without permission. Do not interfere with the site, probe its systems without authorization, or introduce malicious code.</p>
      </PolicySection>
      <PolicySection title="5. Reporting and enforcement">
        <p>If you believe content or activity violates this policy or someone’s rights, email <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a> with the relevant page or content details and a description of the concern. We may review reports, remove or restrict material, suspend access or take other reasonable action where necessary. We may also preserve or disclose information when required by law.</p>
      </PolicySection>
    </PolicyPage>
  );
}
