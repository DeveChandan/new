import JobDetailClient from "@/components/JobDetailClient";
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function getJob(id: string, locale: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/jobs/${id}?locale=${locale}`, {
      next: { revalidate: 60 } // Cache job details for 60 seconds
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching job in page.tsx:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const job = await getJob(id, locale);
  if (!job) {
    return {
      title: "Job Not Found | Shramik Seva",
    };
  }

  const title = `${job.title} at ${job.employer?.companyName || job.employer?.name || 'Shramik Seva'} | Shramik Seva`;
  const description = `${job.description?.substring(0, 150)}... Find skilled worker jobs and hiring opportunities on Shramik Seva.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://shramik-seva.com/${locale}/jobs/${id}`,
      images: [{ url: job.employer?.profileImage || "https://shramik-seva.com/logo.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    }
  };
}

export default async function Page({ params }: PageProps) {
  const { id, locale } = await params;
  const job = await getJob(id, locale);

  // Generate Google Jobs schema structured data
  const jsonLd = job ? {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.createdAt || new Date().toISOString(),
    "validThrough": job.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": job.workType === "temporary" ? "TEMPORARY" : "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.employer?.companyName || job.employer?.name || "Shramik Seva",
      "sameAs": "https://shramik-seva.com"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location?.city || "India",
        "addressRegion": job.location?.state || "India",
        "addressCountry": "IN"
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary,
        "unitText": job.workType === "temporary" ? "DAY" : "MONTH"
      }
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobDetailClient initialJob={job} />
    </>
  );
}