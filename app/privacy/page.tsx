import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="This policy describes how Impura Vida Magazine handles personal information when you browse the site, create an account, use a membership, contact us, or make a purchase."
    >
      <PolicySection title="1. Who is responsible">
        <p>Impura Vida operates impuravidamagazine.com and is responsible for personal information collected through the site. The business location is Santa Teresa, Costa Rica. For privacy questions or requests, email <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a>.</p>
      </PolicySection>
      <PolicySection title="2. Information we collect">
        <p>Depending on how you use the site, we may handle:</p>
        <ul>
          <li>Account information such as your email address, account identifier and any display name you provide.</li>
          <li>Authentication and session information needed to sign you in and keep your account secure.</li>
          <li>Membership, catalogue access, purchase and order status information.</li>
          <li>For physical shop orders, the delivery address and recipient details needed to fulfil the order.</li>
          <li>Messages and information you choose to include when contacting support.</li>
          <li>Technical and security information that hosting and service providers process when delivering and protecting the site, such as IP address, request time and browser information.</li>
        </ul>
        <p>Card and payment credentials are entered with the payment provider. We do not store full payment card numbers on our website.</p>
      </PolicySection>
      <PolicySection title="3. How we use information and our legal grounds">
        <p>We use information to provide and secure accounts, authenticate sign-ins, deliver purchased access, manage memberships and orders, arrange physical delivery, respond to support requests, prevent fraud and meet legal or accounting obligations. We rely on the steps needed to provide a service or fulfil a purchase, our legitimate interests in operating and securing the site, and legal obligations. Where we ask for consent for an optional use, you can withdraw that consent.</p>
      </PolicySection>
      <PolicySection title="4. Service providers and sharing">
        <p>We share only the information needed with providers that help run the service: Supabase for account authentication, database and private media storage; Vercel for website hosting and delivery; Stripe for checkout and subscription management; and Verotel for membership payments where that option is used. These providers process information under their own privacy terms and applicable agreements.</p>
        <p>We may also disclose information where required by law, to protect the rights and security of users or the service, or as part of a business transfer. We do not sell personal information or use it for third-party advertising.</p>
      </PolicySection>
      <PolicySection title="5. International processing">
        <p>Our service providers may process information in countries outside the United Kingdom. Where required, appropriate safeguards are used for international transfers. You can contact us for more information about the safeguards relevant to your information.</p>
      </PolicySection>
      <PolicySection title="6. Retention and security">
        <p>We keep information for as long as needed to provide your account, membership or purchase, respond to you, meet legal and accounting requirements, and address security or payment disputes. Retention periods vary by type of record. We use access controls and private storage for paid media, but no online service can promise absolute security.</p>
      </PolicySection>
      <PolicySection title="7. Cookies and similar technology">
        <p>The site uses essential session technology to support sign-in and account security. Our current site does not intentionally use advertising or analytics cookies. Your browser may also retain standard technical information needed to load and protect a website.</p>
      </PolicySection>
      <PolicySection title="8. Your rights">
        <p>Depending on your location and the applicable law, you may have the right to request access to, correction of, deletion of, restriction of, or a copy of your personal information, or to object to certain processing. Contact <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a> to make a request. We may need to verify your identity and may retain information where the law requires or permits it.</p>
        <p>If you are in the UK, you may also complain to the <a href="https://ico.org.uk/make-a-complaint/" rel="noreferrer" target="_blank">Information Commissioner’s Office</a>.</p>
      </PolicySection>
      <PolicySection title="9. Children">
        <p>The site and paid content are intended for adults aged 18 or over. We do not knowingly create accounts for people under 18. If you believe a person under 18 has provided personal information, contact us so we can review and take appropriate action.</p>
      </PolicySection>
      <PolicySection title="10. Changes to this policy">
        <p>We may update this policy as the site or its providers change. The current version and its update date will be published on this page.</p>
      </PolicySection>
    </PolicyPage>
  );
}
