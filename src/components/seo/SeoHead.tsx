import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PRODUCTION_BASE_URL,
  MIN_LIVE_FOR_LOCATION_INDEX,
  buildPathForView,
  getLocationByDistrict
} from '../../utils/routing';
import { trackAnalyticsEvent } from '../../utils/analytics';
import { TutorProfile, TuitionPost, isTutorVerified } from '../../types';

const DEFAULT_OG_IMAGE = `${PRODUCTION_BASE_URL}/og-share.jpg`;
const DEFAULT_OG_IMAGE_ALT = 'FeLoW WebStaR tutor mentoring a student in Bangladesh';
const DYNAMIC_JSONLD_ID = 'felow-dynamic-jsonld';

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string | null) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!href) {
    if (link) link.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setDynamicJsonLd(payload: Record<string, unknown> | null) {
  const existing = document.getElementById(DYNAMIC_JSONLD_ID);
  if (!payload) {
    if (existing) existing.remove();
    return;
  }
  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = DYNAMIC_JSONLD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}

function buildTutorSchema(tutor: TutorProfile, canonicalUrl: string) {
  const subjectsSummary = tutor.subjects.slice(0, 5).join(', ');
  const description =
    tutor.headline ||
    `${tutor.university || 'University'}${tutor.department ? ` (${tutor.department})` : ''} tutor in ${tutor.district}, Bangladesh${
      subjectsSummary ? ` teaching ${subjectsSummary}` : ''
    }.`;

  const personSchema: Record<string, unknown> = {
    '@type': 'Person',
    name: tutor.name,
    url: canonicalUrl,
    jobTitle: tutor.headline || `${tutor.university || 'University'} Tutor`,
    description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: tutor.district,
      addressCountry: 'BD'
    }
  };

  if (tutor.university) {
    personSchema.alumniOf = {
      '@type': 'CollegeOrUniversity',
      name: tutor.university
    };
  }

  if (tutor.subjects.length > 0) {
    personSchema.knowsAbout = tutor.subjects.slice(0, 10);
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Tutors', item: `${PRODUCTION_BASE_URL}/tutors` },
          { '@type': 'ListItem', position: 3, name: tutor.name, item: canonicalUrl }
        ]
      },
      {
        '@type': 'ProfilePage',
        url: canonicalUrl,
        name: `${tutor.name} — Tutor Profile | FeLoW WebStaR`,
        mainEntity: personSchema
      }
    ]
  };
}

function buildTuitionSchema(post: TuitionPost, canonicalUrl: string) {
  const descriptionParts = [
    post.requirementsDescription,
    post.classGrade ? `Class: ${post.classGrade}` : '',
    post.subjects.length > 0 ? `Subjects: ${post.subjects.join(', ')}` : '',
    post.medium ? `Medium: ${post.medium}` : '',
    post.tuitionType ? `Format: ${post.tuitionType}` : '',
    post.daysPerWeek ? `Schedule: ${post.daysPerWeek} days/week` : ''
  ].filter(Boolean);

  const validDate =
    post.createdAt || (post.postedDate ? `${post.postedDate}T00:00:00Z` : undefined);
  const canEmitJobPosting = Boolean(
    !post.isSample &&
      post.status === 'open' &&
      post.title &&
      descriptionParts.length > 0 &&
      validDate &&
      post.district &&
      post.salaryOfferBDT > 0
  );

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Tuitions', item: `${PRODUCTION_BASE_URL}/tuitions` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl }
      ]
    }
  ];

  if (canEmitJobPosting) {
    graph.push({
      '@type': 'JobPosting',
      title: post.title,
      description: descriptionParts.join(' · '),
      datePosted: validDate,
      employmentType: 'PART_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'FeLoW WebStaR',
        sameAs: `${PRODUCTION_BASE_URL}/`
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: post.area || post.district,
          addressRegion: post.district,
          addressCountry: 'BD'
        }
      },
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'BDT',
        value: {
          '@type': 'QuantitativeValue',
          value: post.salaryOfferBDT,
          unitText: 'MONTH'
        }
      }
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}

export const SeoHead: React.FC = () => {
  const {
    activeView,
    directoryTab,
    districtFilter,
    selectedTutor,
    selectedTuition,
    tutors,
    tuitionPosts,
    language
  } = useApp();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    }
  }, [language]);

  useEffect(() => {
    const resolvedTutor =
      activeView === 'tutor-detail'
        ? tutors.find(t => t.id === selectedTutor?.id) || selectedTutor || null
        : null;

    const resolvedTuition =
      activeView === 'tuition-detail'
        ? tuitionPosts.find(p => p.id === selectedTuition?.id) || selectedTuition || null
        : null;

    let title = 'FeLoW WebStaR | Find Tutors & Tuition in Bangladesh';
    let description =
      'Find tutors and tuition opportunities across Bangladesh with FeLoW WebStaR. Discover tutor profiles, explore tuition listings, and connect directly through WhatsApp.';
    let canonical: string | null = `${PRODUCTION_BASE_URL}/`;
    let robots = 'index, follow';
    let ogType = 'website';
    let jsonLd: Record<string, unknown> | null = null;

    const activeLocation = getLocationByDistrict(districtFilter);

    if (activeView === 'landing') {
      canonical = `${PRODUCTION_BASE_URL}/`;
    } else if (activeView === 'tutors') {
      if (activeLocation) {
        const liveTutorsInDistrict = tutors.filter(
          t =>
            !t.isSample &&
            t.isPublished !== false &&
            t.profileVisibility !== 'hidden' &&
            t.district === activeLocation.district
        ).length;
        const hasEnoughLiveSupply = liveTutorsInDistrict >= MIN_LIVE_FOR_LOCATION_INDEX;
        title = `Home & Online Tutors in ${activeLocation.displayName}, Bangladesh | FeLoW WebStaR`;
        description = `Find verified university tutors in ${activeLocation.displayName} (${activeLocation.highlights}) on FeLoW WebStaR and connect via WhatsApp.`;
        canonical = hasEnoughLiveSupply
          ? `${PRODUCTION_BASE_URL}/tutors/${activeLocation.slug}`
          : `${PRODUCTION_BASE_URL}/tutors`;
        robots = hasEnoughLiveSupply ? 'index, follow' : 'noindex, follow';
        if (hasEnoughLiveSupply) {
          jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Tutors', item: `${PRODUCTION_BASE_URL}/tutors` },
              { '@type': 'ListItem', position: 3, name: activeLocation.displayName, item: canonical }
            ]
          };
        }
      } else {
        title = 'Browse Tutors in Bangladesh | Home & Online Tutors | FeLoW WebStaR';
        description =
          'Explore university tutors across Dhaka, Rajshahi, Chattogram, Sylhet, Khulna, and all 64 districts of Bangladesh on FeLoW WebStaR.';
        canonical = `${PRODUCTION_BASE_URL}/tutors`;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Tutors', item: canonical }
          ]
        };
      }
    } else if (activeView === 'tuitions') {
      if (activeLocation) {
        const livePostsInDistrict = tuitionPosts.filter(
          p => !p.isSample && p.status === 'open' && p.district === activeLocation.district
        ).length;
        const hasEnoughLiveSupply = livePostsInDistrict >= MIN_LIVE_FOR_LOCATION_INDEX;
        title = `Open Tuition Jobs in ${activeLocation.displayName}, Bangladesh | FeLoW WebStaR`;
        description = `Explore open home and online tuition opportunities in ${activeLocation.displayName} (${activeLocation.highlights}) on FeLoW WebStaR.`;
        canonical = hasEnoughLiveSupply
          ? `${PRODUCTION_BASE_URL}/tuitions/${activeLocation.slug}`
          : `${PRODUCTION_BASE_URL}/tuitions`;
        robots = hasEnoughLiveSupply ? 'index, follow' : 'noindex, follow';
        if (hasEnoughLiveSupply) {
          jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Tuitions', item: `${PRODUCTION_BASE_URL}/tuitions` },
              { '@type': 'ListItem', position: 3, name: activeLocation.displayName, item: canonical }
            ]
          };
        }
      } else {
        title = 'Open Tuition Jobs & Opportunities in Bangladesh | FeLoW WebStaR';
        description =
          'Browse open home tuition and online tutoring opportunities from students and guardians across Bangladesh on FeLoW WebStaR.';
        canonical = `${PRODUCTION_BASE_URL}/tuitions`;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Tuitions', item: canonical }
          ]
        };
      }
    } else if (activeView === 'for-guardians') {
      title = 'Find a Home or Online Tutor in Bangladesh | Guardian Guide | FeLoW WebStaR';
      description =
        'Learn how students and parents across Bangladesh can find verified university tutors, post free tuition requests, and connect safely via WhatsApp.';
      canonical = `${PRODUCTION_BASE_URL}/for-guardians`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'For Students & Guardians', item: canonical }
            ]
          },
          {
            '@type': 'WebPage',
            name: title,
            url: canonical,
            description
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How can parents and students find a qualified home tutor in Bangladesh?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Browse the FeLoW WebStaR tutor directory by district, subject, curriculum medium, and class level to compare university tutors, or publish a free tuition post so matching tutors can apply directly.'
                }
              },
              {
                '@type': 'Question',
                name: 'How do students and guardians register on FeLoW WebStaR?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Click Sign In, select Student / Guardian, and continue with your verified Google account. A single Student / Guardian account lets you save tutors, post open tuition requirements, review tutor applications, and coordinate via WhatsApp.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is my phone number or home address shown publicly when I post a tuition?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No. Guardian WhatsApp numbers and detailed home addresses are isolated in private records and never exposed on public directory pages.'
                }
              }
            ]
          }
        ]
      };
    } else if (activeView === 'become-a-tutor') {
      title = 'Become a Tutor in Bangladesh | Tuition Jobs & Registration | FeLoW WebStaR';
      description =
        'Create a public tutor profile on FeLoW WebStaR, verify your university credentials, apply to open tuition jobs across Bangladesh, and connect via WhatsApp.';
      canonical = `${PRODUCTION_BASE_URL}/become-a-tutor`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Become a Tutor', item: canonical }
            ]
          },
          {
            '@type': 'WebPage',
            name: title,
            url: canonical,
            description
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How can university students find tuition jobs in Bangladesh?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Create a complete tutor profile on FeLoW WebStaR using your Google account, list your university, department, preferred teaching areas, and subjects, and submit tailored proposals to open tuition posts in your district or online.'
                }
              },
              {
                '@type': 'Question',
                name: 'How does tutor verification work on FeLoW WebStaR?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'After publishing your profile, upload your student ID, national ID, or academic certificate in your Tutor Dashboard. Verification documents stay strictly private to you and moderation admins while verified badges appear on your public profile.'
                }
              },
              {
                '@type': 'Question',
                name: 'How do tutors and guardians communicate once an application is accepted?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Communication happens directly over WhatsApp—no internal chat friction. You also control your contact visibility settings and WhatsApp consent in your profile preferences.'
                }
              }
            ]
          }
        ]
      };
    } else if (activeView === 'how-it-works') {
      title = 'How FeLoW WebStaR Works | Tutors & Guardians Guide';
      description =
        'Learn how students, guardians, and university tutors verify profiles, post tuition needs, apply, and connect safely via WhatsApp on FeLoW WebStaR.';
      canonical = `${PRODUCTION_BASE_URL}/how-it-works`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'How It Works', item: canonical }
            ]
          },
          {
            '@type': 'WebPage',
            name: title,
            url: canonical,
            description
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How can I find a tutor in Bangladesh on FeLoW WebStaR?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Open the Tutor Directory, filter by your district, curriculum medium, and subject, inspect each tutor’s academic profile, and either send an invite or connect directly on WhatsApp.'
                }
              },
              {
                '@type': 'Question',
                name: 'Does FeLoW WebStaR have an internal chat system?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No. FeLoW WebStaR uses direct WhatsApp communication after consent or application acceptance so parents and tutors can coordinate schedules faster.'
                }
              }
            ]
          }
        ]
      };
    } else if (activeView === 'about') {
      title = 'About FeLoW WebStaR | Bangladesh Tuition Marketplace';
      description =
        'FeLoW WebStaR connects families in Bangladesh with verified university tutors through transparent academic credentials and privacy-first WhatsApp contact.';
      canonical = `${PRODUCTION_BASE_URL}/about`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_BASE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'About', item: canonical }
            ]
          },
          {
            '@type': 'AboutPage',
            name: title,
            url: canonical,
            description
          }
        ]
      };
    } else if (activeView === 'tutor-detail') {
      if (!resolvedTutor) {
        title = 'Tutor Not Found | FeLoW WebStaR';
        description = 'This tutor profile could not be found on FeLoW WebStaR.';
        canonical = null;
        robots = 'noindex, nofollow';
      } else {
        const isPublicReal =
          !resolvedTutor.isSample &&
          resolvedTutor.isPublished !== false &&
          resolvedTutor.profileVisibility !== 'hidden' &&
          Boolean(resolvedTutor.name?.trim()) &&
          Boolean(resolvedTutor.university?.trim());
        const primarySubject = resolvedTutor.subjects[0] || (isTutorVerified(resolvedTutor) ? 'Verified' : 'Private');
        const locationLabel = resolvedTutor.district || 'Bangladesh';
        title = `${resolvedTutor.name} | ${primarySubject} Tutor in ${locationLabel} | FeLoW WebStaR`;
        description =
          resolvedTutor.headline ||
          `${resolvedTutor.name}, ${resolvedTutor.university || 'University'} tutor in ${locationLabel}. Teaches ${resolvedTutor.subjects
            .slice(0, 4)
            .join(', ')}.`;
        const path = buildPathForView('tutor-detail', { tutorId: resolvedTutor.id });
        canonical = isPublicReal ? `${PRODUCTION_BASE_URL}${path}` : null;
        robots = isPublicReal ? 'index, follow' : 'noindex, nofollow';
        ogType = 'profile';
        if (isPublicReal) {
          jsonLd = buildTutorSchema(resolvedTutor, `${PRODUCTION_BASE_URL}${path}`);
        }
      }
    } else if (activeView === 'tuition-detail') {
      if (!resolvedTuition) {
        title = 'Tuition Post Not Found | FeLoW WebStaR';
        description = 'This tuition post is no longer available on FeLoW WebStaR.';
        canonical = null;
        robots = 'noindex, nofollow';
      } else {
        const isPublicOpenReal = !resolvedTuition.isSample && resolvedTuition.status === 'open';
        title = `${resolvedTuition.title} | FeLoW WebStaR`;
        description = `${resolvedTuition.classGrade} tuition in ${resolvedTuition.area || resolvedTuition.district}, ${resolvedTuition.district} (${resolvedTuition.medium}). Offered salary: BDT ${resolvedTuition.salaryOfferBDT}/month.`;
        const path = buildPathForView('tuition-detail', { tuitionId: resolvedTuition.id });
        canonical = isPublicOpenReal ? `${PRODUCTION_BASE_URL}${path}` : null;
        robots = isPublicOpenReal ? 'index, follow' : 'noindex, nofollow';
        if (isPublicOpenReal) {
          jsonLd = buildTuitionSchema(resolvedTuition, `${PRODUCTION_BASE_URL}${path}`);
        }
      }
    } else if (activeView === 'login') {
      title = 'Sign In | FeLoW WebStaR';
      description = 'Sign in to FeLoW WebStaR with Google to manage tuition posts or your tutor profile.';
      canonical = null;
      robots = 'noindex, nofollow';
    } else if (activeView === 'dashboard') {
      title = 'Account Dashboard | FeLoW WebStaR';
      description = 'Manage your FeLoW WebStaR account, saved tutors, tuition posts, and applications.';
      canonical = null;
      robots = 'noindex, nofollow';
    } else if (activeView === 'tutor-onboarding') {
      title = 'Tutor Profile Setup | FeLoW WebStaR';
      description = 'Complete your FeLoW WebStaR tutor profile details.';
      canonical = null;
      robots = 'noindex, nofollow';
    } else if (activeView === 'admin') {
      title = 'Admin Moderation | FeLoW WebStaR';
      description = 'Restricted moderation panel for FeLoW WebStaR administrators.';
      canonical = null;
      robots = 'noindex, nofollow';
    } else {
      title = 'Page Not Found | FeLoW WebStaR';
      description = 'The requested page could not be found on FeLoW WebStaR.';
      canonical = null;
      robots = 'noindex, nofollow';
    }

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertCanonical(canonical);

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', 'FeLoW WebStaR');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical || PRODUCTION_BASE_URL);
    upsertMeta('property', 'og:image', DEFAULT_OG_IMAGE);
    upsertMeta('property', 'og:image:alt', DEFAULT_OG_IMAGE_ALT);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);
    upsertMeta('name', 'twitter:image:alt', DEFAULT_OG_IMAGE_ALT);

    setDynamicJsonLd(jsonLd);

    const resolvedPath = buildPathForView(activeView, {
      tutorId: resolvedTutor?.id,
      tuitionId: resolvedTuition?.id,
      districtFilter
    });
    trackAnalyticsEvent('page_view', {
      page_path: resolvedPath,
      page_title: title
    });
  }, [activeView, directoryTab, districtFilter, selectedTutor, selectedTuition, tutors, tuitionPosts]);

  return null;
};
