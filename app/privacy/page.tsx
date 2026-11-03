import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="A short explanation of the personal information Impura Vida uses to run your account, purchases and the website."
    >
      <PolicySection title="Information we use">
        <p>We may use your email and account details, membership and purchase records, support messages, and delivery details for physical orders. Our hosting, sign-in, storage and payment providers may process technical or transaction information to provide their services. Payment card details are handled by the payment provider, not stored in full on this website.</p>
      </PolicySection>
      <PolicySection title="Why we use it">
        <p>We use information to operate and secure accounts, provide purchased access, process orders and payments, arrange delivery, answer support requests, and meet legal obligations. We do not sell your personal information.</p>
      </PolicySection>
      <PolicySection title="Your choices and contact">
        <p>You can ask us about the personal information associated with your account, or request a correction or deletion where applicable. Some records may need to be kept for legal, payment or security reasons. Contact <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a> with privacy questions or requests.</p>
      </PolicySection>
    </PolicyPage>
  );
}
