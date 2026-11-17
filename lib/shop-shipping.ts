// Supported shipping destinations from Stripe Checkout's allowed_countries enum.
// https://docs.stripe.com/api/checkout/sessions/create?query=shipping_address_collection
const countries = new Set("AC AD AE AF AG AI AL AM AO AQ AR AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CV CW CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IS IT JE JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MK ML MM MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SZ TA TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VN VU WF WS XK YE YT ZA ZM ZW".split(' '));
const europe = new Set('AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GI GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM TR UA VA XK'.split(' '));
const domestic = new Set(['GB', 'GG', 'IM', 'JE']);
const amountKeys = ['SHOP_SHIPPING_UK_PENCE', 'SHOP_SHIPPING_EUROPE_PENCE', 'SHOP_SHIPPING_INTERNATIONAL_PENCE'] as const;

function configuredAmounts() {
  const amounts = amountKeys.map(key => {
    const raw = process.env[key] || '';
    return /^\d+$/.test(raw) ? Number(raw) : NaN;
  });
  return amounts.every(amount => Number.isSafeInteger(amount) && amount >= 0 && amount <= 100000) ? amounts : null;
}

export function shopShippingConfigured() { return configuredAmounts() !== null; }

export function getShopShipping(country: string) {
  const amounts = configuredAmounts();
  if (!amounts || !countries.has(country)) return null;
  const region = domestic.has(country) ? 0 : europe.has(country) ? 1 : 2;
  const names = ['UK delivery', 'Europe delivery', 'International delivery'];
  return { country, amount: amounts[region], label: names[region] };
}

export function getShopShippingDestinations() {
  if (!shopShippingConfigured()) return [];
  const names = new Intl.DisplayNames(['en-GB'], { type: 'region' });
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
  return [...countries].map(country => ({ country, name: names.of(country) || country, amount: getShopShipping(country)!.amount }))
    .sort((a, b) => a.country === 'GB' ? -1 : b.country === 'GB' ? 1 : a.name.localeCompare(b.name))
    .map(item => ({ ...item, label: `${item.name} — ${money.format(item.amount / 100)} postage` }));
}

export function shopShippingCheckoutFields(country: string): Record<string, string> | null {
  const shipping = getShopShipping(country);
  if (!shipping) return null;
  return {
    'shipping_address_collection[allowed_countries][0]': shipping.country,
    'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
    'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(shipping.amount),
    'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'gbp',
    'shipping_options[0][shipping_rate_data][display_name]': shipping.label,
  };
}
