/**
 * Donor recognition wall — public shoutout data.
 * Replace `loadDonorShoutoutTiers` with a real API call when the backend exposes
 * opt-in display names and tier assignment (lifetime or fiscal year).
 */

export type DonorShoutoutTierId = 'cornerstone' | 'partner' | 'friend';

export interface DonorShoutoutDonor {
  id: string;
  /** Public label; use "Anonymous" when the donor opted out of named recognition */
  displayName: string;
}

export interface DonorShoutoutTier {
  id: DonorShoutoutTierId;
  label: string;
  subtitle: string;
  /** Lower numbers sort first (top of page = highest tier) */
  sortOrder: number;
  donors: DonorShoutoutDonor[];
}

const MOCK_TIERS: DonorShoutoutTier[] = [
  {
    id: 'cornerstone',
    label: 'Cornerstone',
    subtitle: 'Leadership gifts that anchor our long-term work with children and families.',
    sortOrder: 0,
    donors: [
      { id: '1', displayName: 'Rivera Family Foundation' },
      { id: '2', displayName: 'James & Maria Okonkwo' },
    ],
  },
  {
    id: 'partner',
    label: 'Partner',
    subtitle: 'Consistent and generous gifts that help us plan ahead and deepen our impact.',
    sortOrder: 1,
    donors: [
      { id: '3', displayName: 'Central America Giving Circle' },
      { id: '4', displayName: 'Anonymous' },
      { id: '5', displayName: 'Elena Vásquez' },
      { id: '6', displayName: 'Michael Chen' },
      { id: '7', displayName: 'St. Clare Parish Outreach' },
      { id: '8', displayName: 'Priya & Dev Shah' },
      { id: '9', displayName: 'Anonymous' },
    ],
  },
  {
    id: 'friend',
    label: 'Friend',
    subtitle: 'Every gift matters — thank you for standing with Lucera and the communities we serve.',
    sortOrder: 2,
    donors: [
      { id: '10', displayName: 'Alex Morgan' },
      { id: '11', displayName: 'Taylor Brooks' },
      { id: '12', displayName: 'Jordan Lee' },
      { id: '13', displayName: 'Sam Rivera' },
      { id: '14', displayName: 'Casey Nguyen' },
    ],
  },
];

/**
 * Loads tiered donor recognition data for the public shoutout page.
 * Today: returns mock data. Later: `GET` a public endpoint and map JSON to `DonorShoutoutTier[]`.
 */
export async function loadDonorShoutoutTiers(): Promise<DonorShoutoutTier[]> {
  const apiUrl = import.meta.env.VITE_DONOR_SHOUTOUT_URL as string | undefined;
  if (apiUrl) {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Failed to load donor shoutouts');
    const data = (await res.json()) as DonorShoutoutTier[];
    return [...data].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return [...MOCK_TIERS].sort((a, b) => a.sortOrder - b.sortOrder);
}
