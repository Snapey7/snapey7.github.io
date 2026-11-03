import type { Metadata } from 'next';
import { PolicyPage, PolicySection } from '@/components/site/PolicyPage';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      intro="The essentials for using Impura Vida Magazine, creating an account, and buying memberships, digital catalogues or shop products."
    >
      <PolicySection title="Using the site">
        <p>Impura Vida operates impuravidamagazine.com from Santa Teresa, Costa Rica. You must be 18 or older to create an account, buy content or access member areas. Keep your account details secure and contact us if you need help.</p>
      </PolicySection>
      <PolicySection title="Purchases and access">
        <p>Memberships provide the access shown at checkout and renew at the displayed interval until cancelled. A one-off catalogue purchase unlocks only the catalogue named at checkout. Physical shop products are subject to availability; shipping costs and delivery details are shown during checkout.</p>
        <p>Paid content is for your personal use. Buying access does not transfer copyright or allow you to copy, share, sell or publish the material.</p>
      </PolicySection>
      <PolicySection title="Your rights and contact">
        <p>We may update or temporarily suspend the site when needed. Nothing in these terms limits consumer rights or other protections that cannot legally be excluded. For questions about the site, an account or an order, email <a href="mailto:impuravidamag@gmail.com">impuravidamag@gmail.com</a>.</p>
      </PolicySection>
    </PolicyPage>
  );
}
