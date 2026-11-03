import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Refund & Cancellation Policy' };

export default function RefundCancellationPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      intro="The basics for canceling memberships, refunds and future price changes at Impura Vida. Your rights under applicable consumer law still apply."
    >
      <PolicySection title="1. Cancellations and Refunds">
        <p>Unless applicable law or the terms shown at checkout provide otherwise, payments are non-refundable. You can cancel a membership at any time through My Account or the payment provider to stop future renewals. Cancellation normally takes effect at the end of the period already paid for, and access may then be limited or removed. If you believe you are entitled to a refund, or need help canceling, contact <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a> with your account email and payment reference.</p>
        <p>Nothing in this policy limits any cancellation, refund or other remedy that cannot legally be excluded.</p>
      </PolicySection>
      <PolicySection title="2. Automatic Renewal of Memberships">
        <p>Memberships renew automatically for the same billing term unless you cancel before the next renewal date. At renewal, the payment provider will charge the then-current membership price shown for your plan. You can manage or cancel your membership through My Account or the payment provider.</p>
      </PolicySection>
      <PolicySection title="3. Changes in Price">
        <p>Impura Vida may change prices or introduce new charges. Any price change will apply to new purchases and, where permitted, to membership terms after the change takes effect. We will give any notice required by applicable law. If you do not accept a price change for a renewing membership, cancel before the next renewal date.</p>
        <p>For a problem with a digital catalogue or physical shop order, contact us with your account email and order or payment reference so we can review it.</p>
      </PolicySection>
    </PolicyPage>
  );
}
