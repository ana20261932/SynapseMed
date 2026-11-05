/**
 * AdapterFactory — resolves the correct ISwitchAdapter based on environment.
 *
 * To wire a real provider:
 *  1. Set SWITCH_PROVIDER=mediswitch in .env
 *  2. Set SWITCH_API_BASE_URL, SWITCH_CLIENT_ID, SWITCH_CLIENT_SECRET
 *  3. Implement a RealSwitchAdapter that satisfies ISwitchAdapter
 *  4. Import it here and add a case below
 */
import { ISwitchAdapter } from './ISwitchAdapter';
import { MockSwitchAdapter } from './MockSwitchAdapter';

export function getSwitchAdapter(): ISwitchAdapter {
  const provider = process.env.SWITCH_PROVIDER ?? 'mock';

  switch (provider.toLowerCase()) {
    case 'mock':
    case 'sandbox':
      return new MockSwitchAdapter();

    // When a real provider SDK is available, add cases here:
    // case 'mediswitch':
    //   return new MediSwitchAdapter({
    //     baseUrl: process.env.SWITCH_API_BASE_URL!,
    //     clientId: process.env.SWITCH_CLIENT_ID!,
    //     clientSecret: process.env.SWITCH_CLIENT_SECRET!,
    //   });
    // case 'healthbridge':
    //   return new HealthbridgeAdapter({ ... });

    default:
      throw new Error(`Unknown SWITCH_PROVIDER: "${provider}". Valid values: mock, sandbox`);
  }
}
