import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getShopShipping, getShopShippingDestinations, shopShippingCheckoutFields, shopShippingConfigured } from '../../lib/shop-shipping.ts';

const keys = ['SHOP_SHIPPING_UK_PENCE', 'SHOP_SHIPPING_EUROPE_PENCE', 'SHOP_SHIPPING_INTERNATIONAL_PENCE'];

test('Physical checkout charges the configured destination price and restricts the shipping address to that country', () => {
  const before = keys.map(key => process.env[key]);
  try {
    [1000, 1250, 1500].forEach((amount, index) => { process.env[keys[index]] = String(amount); });
    for (const [country, amount] of [['GB', 1000], ['FR', 1250], ['DE', 1250], ['CH', 1250], ['US', 1500], ['CR', 1500], ['AU', 1500]]) {
      const fields = shopShippingCheckoutFields(country);
      assert.equal(fields['shipping_options[0][shipping_rate_data][fixed_amount][amount]'], String(amount));
      assert.equal(fields['shipping_options[0][shipping_rate_data][fixed_amount][currency]'], 'gbp');
      assert.equal(fields['shipping_address_collection[allowed_countries][0]'], country);
      assert.equal(Object.keys(fields).filter(key => key.startsWith('shipping_address_collection')).length, 1);
      assert.equal(Object.keys(fields).filter(key => key.startsWith('shipping_options') && !key.startsWith('shipping_options[0]')).length, 0);
    }
    assert.equal(getShopShipping('US').amount, 1500);
    for (const invalid of ['', 'ZZ', 'UK', 'gb', 'GB,US', 'GB&amount=0']) assert.equal(shopShippingCheckoutFields(invalid), null);
    const destinations = getShopShippingDestinations();
    assert.equal(destinations[0].country, 'GB');
    assert.ok(destinations.find(item => item.country === 'US').label.includes('£15.00'));
    assert.ok(destinations.find(item => item.country === 'FR').label.includes('£12.50'));
    delete process.env.SHOP_SHIPPING_UK_PENCE;
    assert.equal(shopShippingConfigured(), false);
    assert.equal(shopShippingCheckoutFields('US'), null);
    assert.deepEqual(getShopShippingDestinations(), []);
    for (const invalid of ['-1', '12.5', 'NaN', '100001']) {
      process.env.SHOP_SHIPPING_UK_PENCE = invalid;
      assert.equal(shopShippingConfigured(), false);
    }
  } finally {
    keys.forEach((key, index) => { if (before[index] === undefined) delete process.env[key]; else process.env[key] = before[index]; });
  }
});
