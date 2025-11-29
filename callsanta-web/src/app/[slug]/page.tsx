import { redirect, notFound } from 'next/navigation';
import { getAffiliateBySlug } from '@/lib/affiliate/server';
import { isReservedSlug } from '@/lib/constants/routes';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic affiliate redirect page
 *
 * Handles URLs like /creator-name and redirects to /book?aff=CODE
 * Returns 404 if the slug is reserved or no matching affiliate is found
 */
export default async function AffiliateRedirectPage({ params }: PageProps) {
  const { slug } = await params;

  // Safety check for reserved routes (shouldn't reach here due to static route priority)
  if (isReservedSlug(slug)) {
    notFound();
  }

  // Look up affiliate by slug
  const affiliate = await getAffiliateBySlug(slug);

  if (!affiliate) {
    notFound();
  }

  // Redirect to booking page with affiliate code
  redirect(`/book?aff=${affiliate.public_code}`);
}

// Generate metadata for SEO (optional, uses affiliate name if found)
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  if (isReservedSlug(slug)) {
    return {};
  }

  const affiliate = await getAffiliateBySlug(slug);

  if (!affiliate) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: `Book a Call with Santa - Referred by ${affiliate.name}`,
    description: `Schedule a magical phone call with Santa Claus. Referred by ${affiliate.name}.`,
  };
}
