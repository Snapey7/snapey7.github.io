import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Refund & Cancellation Policy' };

export default function RefundCancellationPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      intro="How to stop a membership renewal and get help with a digital purchase or shop order. Your consumer rights still apply."
    >
      <PolicySection title="Memberships">
        <p>Cancel through My Account or the payment provider before the next renewal to stop future charges. If you cannot find the cancellation option, email <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a>. Access normally continues until the end of the period already paid for.</p>
      </PolicySection>
      <PolicySection title="Digital content and shop orders">
        <p>If you have a problem with a catalogue, membership or physical order, contact us with your account email and order or payment reference. We will review it and explain the available next steps. Cancellation and refund rights depend on the type of purchase and applicable law; nothing here removes a right or remedy you are entitled to.</p>
      </PolicySection>
    </PolicyPage>
  );
}
