import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Refund & Cancellation Policy' };

export default function RefundCancellationPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      intro="This policy explains how to cancel a membership and how to contact us about digital catalogue purchases and physical shop orders. Your statutory consumer rights still apply."
    >
      <PolicySection title="1. Membership cancellation">
        <p>Memberships renew for the period shown at checkout until cancelled. To stop future renewals, use the membership management link in My Account or the payment provider’s cancellation page. If you cannot access either option, email <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a> and include the account email used to subscribe.</p>
        <p>Cancellation stops future renewals. Unless the payment provider or applicable law says otherwise, membership access remains available through the period already paid for. A cancellation request does not automatically refund a payment that has already been taken.</p>
      </PolicySection>
      <PolicySection title="2. Digital catalogues and other digital content">
        <p>A one-off digital catalogue purchase unlocks the catalogue identified at checkout. If you have a problem with payment, access or the content, contact us and we will investigate and help resolve it.</p>
        <p>Digital content may be subject to statutory cancellation rights. Whether you can cancel an immediately available digital purchase depends on applicable law and the circumstances of the purchase. Nothing in this policy removes a right or remedy that the law gives you.</p>
      </PolicySection>
      <PolicySection title="3. Physical shop orders">
        <p>If you want to cancel a physical order, contact us as soon as possible with your order details. We will try to stop dispatch if the order has not yet been sent. If it has already been dispatched, we will explain the return process and any applicable consumer cancellation rights. Faulty, damaged or misdescribed items remain subject to your statutory rights.</p>
      </PolicySection>
      <PolicySection title="4. Refund requests">
        <p>To request help or a refund, email <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a> with the account email, order or payment reference, and a short description of the issue. We will review the request and explain the next steps. If a refund is due, it will normally be returned through the original payment method by the payment provider.</p>
      </PolicySection>
      <PolicySection title="5. Your legal rights">
        <p>This policy does not limit rights available under consumer law. Applicable cancellation periods and remedies can depend on whether the purchase is a subscription, digital content or a physical product, when access or delivery begins, and the circumstances of the order. If this policy conflicts with a legal right that applies to you, that legal right takes precedence.</p>
      </PolicySection>
    </PolicyPage>
  );
}
