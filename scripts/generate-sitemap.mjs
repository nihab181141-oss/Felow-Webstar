import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit, terminate } from 'firebase/firestore';

const BASE_URL = 'https://felow-webstar.vercel.app';
const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const FIREBASE_CONFIG_PATH = path.join(ROOT_DIR, 'firebase-applet-config.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');
const MIN_LIVE_FOR_LOCATION_INDEX = 3;

const DISTRICT_TO_SLUG = {
  Dhaka: 'dhaka',
  Rajshahi: 'rajshahi',
  Chittagong: 'chattogram',
  Sylhet: 'sylhet',
  Khulna: 'khulna',
  Barisal: 'barishal',
  Rangpur: 'rangpur',
  Mymensingh: 'mymensingh',
  Comilla: 'cumilla',
  Bogra: 'bogura',
  Gazipur: 'gazipur',
  Narayanganj: 'narayanganj'
};

const STATIC_PUBLIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/tutors', changefreq: 'daily', priority: '0.9' },
  { path: '/tuitions', changefreq: 'daily', priority: '0.9' },
  { path: '/for-guardians', changefreq: 'monthly', priority: '0.8' },
  { path: '/become-a-tutor', changefreq: 'monthly', priority: '0.8' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.7' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' }
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toOptionalIsoDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const d = new Date(value.seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function generateSitemap() {
  const urls = STATIC_PUBLIC_ROUTES.map(route => ({
    loc: route.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.path}`,
    lastmod: null,
    changefreq: route.changefreq,
    priority: route.priority
  }));

  if (fs.existsSync(FIREBASE_CONFIG_PATH)) {
    let app = null;
    let db = null;
    try {
      const config = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf8'));
      const projectId = config.projectId;
      const dbId = config.firestoreDatabaseId || '(default)';

      if (projectId && projectId !== 'remixed-project-id') {
        app = initializeApp(config, 'sitemap-generator');
        db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);

        const [tutorSnap, postSnap] = await withTimeout(
          Promise.all([
            getDocs(
              query(
                collection(db, 'tutorProfiles'),
                where('isPublished', '==', true),
                limit(500)
              )
            ),
            getDocs(
              query(
                collection(db, 'tuitionPosts'),
                where('status', '==', 'open'),
                limit(500)
              )
            )
          ]),
          8000,
          'Firestore sitemap query'
        );

        const seenUrls = new Set(urls.map(u => u.loc));
        const tutorDistrictCounts = new Map();
        const tuitionDistrictCounts = new Map();

        for (const docSnap of tutorSnap.docs) {
          const data = docSnap.data();
          const isPublicReal =
            data.isPublished !== false &&
            data.profileVisibility !== 'hidden' &&
            typeof data.name === 'string' &&
            data.name.trim().length > 0 &&
            typeof data.university === 'string' &&
            data.university.trim().length > 0;

          if (isPublicReal) {
            if (data.district) {
              tutorDistrictCounts.set(
                data.district,
                (tutorDistrictCounts.get(data.district) || 0) + 1
              );
            }
            const loc = `${BASE_URL}/tutors/${encodeURIComponent(docSnap.id)}`;
            if (!seenUrls.has(loc)) {
              seenUrls.add(loc);
              urls.push({
                loc,
                lastmod: toOptionalIsoDate(data.updatedAt || data.createdAt),
                changefreq: 'weekly',
                priority: '0.8'
              });
            }
          }
        }

        for (const docSnap of postSnap.docs) {
          const data = docSnap.data();
          const isOpenReal =
            data.status === 'open' &&
            typeof data.title === 'string' &&
            data.title.trim().length > 0;

          if (isOpenReal) {
            if (data.district) {
              tuitionDistrictCounts.set(
                data.district,
                (tuitionDistrictCounts.get(data.district) || 0) + 1
              );
            }
            const loc = `${BASE_URL}/tuitions/${encodeURIComponent(docSnap.id)}`;
            if (!seenUrls.has(loc)) {
              seenUrls.add(loc);
              urls.push({
                loc,
                lastmod: toOptionalIsoDate(data.updatedAt || data.postedDate || data.createdAt),
                changefreq: 'daily',
                priority: '0.8'
              });
            }
          }
        }

        // Only emit location SEO URLs when genuine live supply meets the minimum threshold
        for (const [district, count] of tutorDistrictCounts.entries()) {
          const slug = DISTRICT_TO_SLUG[district];
          if (slug && count >= MIN_LIVE_FOR_LOCATION_INDEX) {
            const loc = `${BASE_URL}/tutors/${slug}`;
            if (!seenUrls.has(loc)) {
              seenUrls.add(loc);
              urls.push({ loc, lastmod: null, changefreq: 'daily', priority: '0.8' });
            }
          }
        }

        for (const [district, count] of tuitionDistrictCounts.entries()) {
          const slug = DISTRICT_TO_SLUG[district];
          if (slug && count >= MIN_LIVE_FOR_LOCATION_INDEX) {
            const loc = `${BASE_URL}/tuitions/${slug}`;
            if (!seenUrls.has(loc)) {
              seenUrls.add(loc);
              urls.push({ loc, lastmod: null, changefreq: 'daily', priority: '0.8' });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[sitemap] Firestore dynamic entries skipped:', err?.message || err);
    } finally {
      if (db) {
        await terminate(db).catch(() => {});
      }
      if (app) {
        await deleteApp(app).catch(() => {});
      }
    }
  }

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(entry => {
      const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`];
      if (entry.lastmod) {
        parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }
      parts.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
      parts.push(`    <priority>${escapeXml(entry.priority)}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    }),
    '</urlset>',
    ''
  ];

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xmlLines.join('\n'), 'utf8');
  console.log(`[sitemap] Generated ${OUTPUT_PATH} with ${urls.length} canonical public URLs.`);
}

generateSitemap();
