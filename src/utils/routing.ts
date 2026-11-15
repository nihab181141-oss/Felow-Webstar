export type RouteView =
  | 'landing'
  | 'tutors'
  | 'tutor-detail'
  | 'tuitions'
  | 'tuition-detail'
  | 'how-it-works'
  | 'about'
  | 'for-guardians'
  | 'become-a-tutor'
  | 'login'
  | 'tutor-onboarding'
  | 'dashboard'
  | 'admin'
  | 'not-found';

export const PRODUCTION_BASE_URL = 'https://felow-webstar.vercel.app';
export const MIN_LIVE_FOR_LOCATION_INDEX = 3;

export interface LocationRouteInfo {
  slug: string;
  district: string;
  displayName: string;
  banglaName: string;
  highlights: string;
}

export const SUPPORTED_LOCATIONS: Record<string, LocationRouteInfo> = {
  dhaka: {
    slug: 'dhaka',
    district: 'Dhaka',
    displayName: 'Dhaka',
    banglaName: 'ঢাকা',
    highlights: 'Dhanmondi, Uttara, Mirpur, Gulshan, Banani, Mohammadpur, Bashundhara R/A, and nearby DU/BUET/NSU/BRACU tutor hubs'
  },
  rajshahi: {
    slug: 'rajshahi',
    district: 'Rajshahi',
    displayName: 'Rajshahi',
    banglaName: 'রাজশাহী',
    highlights: 'Shaheb Bazar, Uposhohor, Kazihata, Motihar, Talaimari, and RU / RUET university corridors'
  },
  chattogram: {
    slug: 'chattogram',
    district: 'Chittagong',
    displayName: 'Chattogram',
    banglaName: 'চট্টগ্রাম',
    highlights: 'GEC Circle, Nasirabad, Panchlaish, Agrabad, Halishahar, Khulshi, and CU / CUET areas'
  },
  sylhet: {
    slug: 'sylhet',
    district: 'Sylhet',
    displayName: 'Sylhet',
    banglaName: 'সিলেট',
    highlights: 'Zindabazar, Amberkhana, Shahjalal Upashahar, Subidbazar, and SUST areas'
  },
  khulna: {
    slug: 'khulna',
    district: 'Khulna',
    displayName: 'Khulna',
    banglaName: 'খুলনা',
    highlights: 'Shibbari, Sonadanga, Boyra, Khalishpur, Daulatpur, and KU / KUET areas'
  },
  barishal: {
    slug: 'barishal',
    district: 'Barisal',
    displayName: 'Barishal',
    banglaName: 'বরিশাল',
    highlights: 'Sadar Road, Rupatali, Nathullabad, and Barishal Sadar areas'
  },
  rangpur: {
    slug: 'rangpur',
    district: 'Rangpur',
    displayName: 'Rangpur',
    banglaName: 'রংপুর',
    highlights: 'Jahaj Company More, Begum Rokeya University Area, and Rangpur Sadar'
  },
  mymensingh: {
    slug: 'mymensingh',
    district: 'Mymensingh',
    displayName: 'Mymensingh',
    banglaName: 'ময়মনসিংহ',
    highlights: 'Town Hall, Ganginarpar, BAU Campus, and Mymensingh Sadar'
  },
  cumilla: {
    slug: 'cumilla',
    district: 'Comilla',
    displayName: 'Cumilla',
    banglaName: 'কুমিল্লা',
    highlights: 'Kandirpar, Kotbari, and Cumilla Sadar'
  },
  bogura: {
    slug: 'bogura',
    district: 'Bogra',
    displayName: 'Bogura',
    banglaName: 'বগুড়া',
    highlights: 'Satmatha and Bogura Sadar'
  },
  gazipur: {
    slug: 'gazipur',
    district: 'Gazipur',
    displayName: 'Gazipur',
    banglaName: 'গাজীপুর',
    highlights: 'Joydebpur, Tongi, and Gazipur Sadar'
  },
  narayanganj: {
    slug: 'narayanganj',
    district: 'Narayanganj',
    displayName: 'Narayanganj',
    banglaName: 'নারায়ণগঞ্জ',
    highlights: 'Chashara, Fatullah, and Narayanganj Sadar'
  }
};

export function getLocationBySlug(slug: string): LocationRouteInfo | null {
  const key = slug.trim().toLowerCase();
  return SUPPORTED_LOCATIONS[key] || null;
}

export function getLocationByDistrict(district: string): LocationRouteInfo | null {
  if (!district || district === 'All') return null;
  const target = district.trim().toLowerCase();
  return (
    Object.values(SUPPORTED_LOCATIONS).find(
      loc => loc.district.toLowerCase() === target || loc.displayName.toLowerCase() === target
    ) || null
  );
}

export interface ParsedAppRoute {
  view: RouteView;
  directoryTab: 'tutors' | 'tuitions';
  tutorId?: string;
  tuitionId?: string;
  locationDistrict?: string;
}

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned || '/';
}

export function parseAppRoute(pathname: string): ParsedAppRoute {
  const path = normalizePathname(pathname);

  if (path === '/') {
    return { view: 'landing', directoryTab: 'tutors' };
  }
  if (path === '/tutors') {
    return { view: 'tutors', directoryTab: 'tutors' };
  }
  if (path === '/tuitions') {
    return { view: 'tuitions', directoryTab: 'tuitions' };
  }
  if (path === '/how-it-works') {
    return { view: 'how-it-works', directoryTab: 'tutors' };
  }
  if (path === '/about') {
    return { view: 'about', directoryTab: 'tutors' };
  }
  if (path === '/for-guardians') {
    return { view: 'for-guardians', directoryTab: 'tutors' };
  }
  if (path === '/become-a-tutor') {
    return { view: 'become-a-tutor', directoryTab: 'tuitions' };
  }
  if (path === '/login') {
    return { view: 'login', directoryTab: 'tutors' };
  }
  if (path === '/tutor-onboarding') {
    return { view: 'tutor-onboarding', directoryTab: 'tutors' };
  }
  if (path === '/dashboard') {
    return { view: 'dashboard', directoryTab: 'tutors' };
  }
  if (path === '/admin') {
    return { view: 'admin', directoryTab: 'tutors' };
  }

  if (path.startsWith('/tutors/')) {
    const id = decodeURIComponent(path.slice('/tutors/'.length)).trim();
    if (id && !id.includes('/')) {
      const loc = getLocationBySlug(id);
      if (loc) {
        return { view: 'tutors', directoryTab: 'tutors', locationDistrict: loc.district };
      }
      return { view: 'tutor-detail', directoryTab: 'tutors', tutorId: id };
    }
  }

  if (path.startsWith('/tuitions/')) {
    const id = decodeURIComponent(path.slice('/tuitions/'.length)).trim();
    if (id && !id.includes('/')) {
      const loc = getLocationBySlug(id);
      if (loc) {
        return { view: 'tuitions', directoryTab: 'tuitions', locationDistrict: loc.district };
      }
      return { view: 'tuition-detail', directoryTab: 'tuitions', tuitionId: id };
    }
  }

  return { view: 'not-found', directoryTab: 'tutors' };
}

export function buildPathForView(
  view: RouteView,
  options?: { tutorId?: string | null; tuitionId?: string | null; districtFilter?: string | null }
): string {
  switch (view) {
    case 'landing':
      return '/';
    case 'tutors': {
      const loc = options?.districtFilter ? getLocationByDistrict(options.districtFilter) : null;
      return loc ? `/tutors/${loc.slug}` : '/tutors';
    }
    case 'tuitions': {
      const loc = options?.districtFilter ? getLocationByDistrict(options.districtFilter) : null;
      return loc ? `/tuitions/${loc.slug}` : '/tuitions';
    }
    case 'tutor-detail':
      return options?.tutorId ? `/tutors/${encodeURIComponent(options.tutorId)}` : '/tutors';
    case 'tuition-detail':
      return options?.tuitionId ? `/tuitions/${encodeURIComponent(options.tuitionId)}` : '/tuitions';
    case 'how-it-works':
      return '/how-it-works';
    case 'about':
      return '/about';
    case 'for-guardians':
      return '/for-guardians';
    case 'become-a-tutor':
      return '/become-a-tutor';
    case 'login':
      return '/login';
    case 'tutor-onboarding':
      return '/tutor-onboarding';
    case 'dashboard':
      return '/dashboard';
    case 'admin':
      return '/admin';
    case 'not-found':
    default:
      return typeof window !== 'undefined' ? normalizePathname(window.location.pathname) : '/';
  }
}
