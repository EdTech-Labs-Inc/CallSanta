// Reserved slugs that cannot be used as affiliate slugs
// These are protected from affiliate registration to avoid routing conflicts

export const RESERVED_SLUGS = [
  // Existing routes
  'book',
  'api',
  'demo',
  'legal',
  'success',
  'cancelled',
  'recording',

  // Future routes
  'admin',
  'affiliate',
  'affiliates',
  'dashboard',
  'login',
  'signup',

  // Brand protection
  'santasnumber',
  'santas-number',
  'santas_number',
  'santacalls',
  'santa-calls',
  'santa_calls',

  // Package names (lib folders)
  'lib',
  'components',
  'hooks',
  'utils',
  'types',
  'constants',
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as ReservedSlug);
}
