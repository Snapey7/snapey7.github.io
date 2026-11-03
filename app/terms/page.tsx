import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      intro="These terms explain how you may use the Impura Vida Magazine website, memberships, digital catalogues and shop. By using the site or placing an order, you agree to these terms."
    >
      <PolicySection title="1. About these terms">
        <p>“Impura Vida Magazine”, “we”, “us” and “our” refer to the people operating the Impura Vida Magazine website at impuravidamagazine.com. For questions, contact <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a>.</p>
        <p>These terms apply alongside the <a href="/privacy">Privacy Policy</a>, <a href="/refund-cancellation">Refund &amp; Cancellation Policy</a> and <a href="/acceptable-use">Acceptable Use Policy</a>. They do not remove or limit any rights that cannot legally be excluded.</p>
      </PolicySection>
      <PolicySection title="2. Age and accounts">
        <p>You must be at least 18 years old to create an account, purchase a membership or catalogue, or access member content. Keep your sign-in details secure and tell us promptly if you believe someone else has accessed your account. You are responsible for activity carried out through your account, except where applicable law says otherwise.</p>
      </PolicySection>
      <PolicySection title="3. Memberships and digital purchases">
        <p>Memberships provide access to the benefits described on the membership page while the membership is active. Memberships renew according to the billing period and price shown at checkout unless cancelled before renewal. You can manage or cancel an eligible membership from My Account or through the payment provider’s subscription management page.</p>
        <p>A separately purchased digital catalogue unlocks the catalogue identified at checkout. It does not automatically grant access to other muse catalogues or membership-only material. Access is associated with the purchasing account and is for your personal, non-commercial use.</p>
        <p>Payment is processed by the payment provider shown at checkout. Prices, currency, billing period and any applicable delivery charges are displayed before you place an order.</p>
      </PolicySection>
      <PolicySection title="4. Shop orders">
        <p>Physical products are sold subject to availability. Product descriptions, price, delivery destinations, shipping costs and estimated delivery information are shown during the order process where available. Delivery estimates are not guarantees. Risk in a physical item passes to you when it is delivered, subject to your statutory rights.</p>
      </PolicySection>
      <PolicySection title="5. Our content and intellectual property">
        <p>Editorials, photographs, writing, design, branding and other materials on the site belong to Impura Vida Magazine or their credited creators and rights holders. Buying access gives you a personal licence to view the relevant content; it does not transfer copyright or give permission to reproduce, distribute, publish, sell, or commercially use it.</p>
        <p>You must not share account access, redistribute paid content, remove rights notices, or use technical means to bypass access controls. Public editorial content may include work credited to independent creators; their work remains subject to its own rights.</p>
      </PolicySection>
      <PolicySection title="6. Acceptable use and enforcement">
        <p>You agree to use the site lawfully and in line with our <a href="/acceptable-use">Acceptable Use Policy</a>. We may suspend access where reasonably necessary to protect users, content, the service, or to address suspected misuse, fraud or legal requirements. Where appropriate, we will explain the reason and restore access if the issue is resolved.</p>
      </PolicySection>
      <PolicySection title="7. Availability and changes">
        <p>We may update or temporarily suspend parts of the site for maintenance, security, legal or operational reasons. We may change these terms by publishing an updated version here. The updated date will be shown above; changes will not take away rights that have already accrued or statutory consumer protections.</p>
      </PolicySection>
      <PolicySection title="8. Liability and consumer rights">
        <p>Nothing in these terms excludes or limits liability where doing so would be unlawful, including your statutory consumer rights. To the extent permitted by law, we are not responsible for losses that were not reasonably foreseeable or for losses caused by events outside our reasonable control. Nothing here affects your right to seek a remedy for a faulty product, service or digital content where the law provides one.</p>
      </PolicySection>
      <PolicySection title="9. Contact">
        <p>For account, order, content or terms questions, email <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a>.</p>
      </PolicySection>
    </PolicyPage>
  );
}
