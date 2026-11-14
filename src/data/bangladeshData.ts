// Bangladesh Divisions, All 64 Districts, and Upazila / Area Taxonomies
export const BD_DIVISIONS = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const;

export const BD_DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  Dhaka: [
    'Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur',
    'Narsingdi', 'Manikganj', 'Munshiganj', 'Kishoreganj',
    'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur'
  ],
  Chittagong: [
    'Chittagong', "Cox's Bazar", 'Comilla', 'Feni', 'Brahmanbaria',
    'Noakhali', 'Chandpur', 'Lakshmipur', 'Rangamati', 'Bandarban', 'Khagrachhari'
  ],
  Rajshahi: [
    'Rajshahi', 'Bogra', 'Pabna', 'Sirajganj', 'Naogaon',
    'Natore', 'Chapai Nawabganj', 'Joypurhat'
  ],
  Khulna: [
    'Khulna', 'Jessore', 'Kushtia', 'Satkhira', 'Bagerhat',
    'Jhenaidah', 'Chuadanga', 'Meherpur', 'Magura', 'Narail'
  ],
  Barisal: [
    'Barisal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Jhalokati', 'Barguna'
  ],
  Sylhet: [
    'Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'
  ],
  Rangpur: [
    'Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari',
    'Panchagarh', 'Thakurgaon', 'Lalmonirhat'
  ],
  Mymensingh: [
    'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'
  ]
};

// Flattened 64 districts
export const ALL_BD_DISTRICTS = Object.values(BD_DISTRICTS_BY_DIVISION).flat().sort();

export function getDivisionByDistrict(district: string): string {
  for (const [division, districts] of Object.entries(BD_DISTRICTS_BY_DIVISION)) {
    if (districts.includes(district)) {
      return division;
    }
  }
  return 'Dhaka';
}

// Popular Areas & Upazilas across key districts + fallback for all 64 districts
export const POPULAR_AREAS_BY_DISTRICT: Record<string, string[]> = {
  Dhaka: [
    'Dhanmondi', 'Gulshan 1', 'Gulshan 2', 'Banani', 'Mirpur (1-14)',
    'Uttara (Sectors 1-18)', 'Mohammadpur', 'Bashundhara R/A', 'Badda / Rampura',
    'Khilgaon / Malibagh', 'Lalbagh / Old Dhaka', 'Motijheel / Dilkusha',
    'Farmgate / Tejgaon', 'Azimpur / New Market', 'Shantinagar / Bailey Road',
    'Baridhara / DOHS', 'Mohakhali / Niketan', 'Wari', 'Jatrabari',
    'Savar', 'Keraniganj', 'Dhamrai', 'Dohar', 'Nawabganj'
  ],
  Gazipur: ['Gazipur Sadar', 'Tongi', 'Joydebpur', 'Kaliakoir', 'Kapasia', 'Sreepur', 'Kaliganj'],
  Narayanganj: ['Narayanganj Sadar', 'Chashara', 'Fatullah', 'Siddhirganj', 'Bandar', 'Rupganj', 'Sonargaon', 'Araihazar'],
  Tangail: ['Tangail Sadar', 'Mirzapur', 'Kalihati', 'Sakhipur', 'Gopalpur', 'Madhupur', 'Ghatail'],
  Faridpur: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda'],
  Narsingdi: ['Narsingdi Sadar', 'Madhabdi', 'Palash', 'Shibpur', 'Raipura', 'Belabo'],
  Manikganj: ['Manikganj Sadar', 'Singair', 'Saturia', 'Shibalaya', 'Ghior'],
  Munshiganj: ['Munshiganj Sadar', 'Sreenagar', 'Lohajang', 'Sirajdikhan', 'Gazaria'],
  Kishoreganj: ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Katiadi', 'Karimganj', 'Pakundia'],
  Chittagong: [
    'GEC Circle', 'Agrabad', 'Nasirabad', 'Panchlaish', 'Khulshi',
    'Halishahar', 'Chawkbazar', 'Kotwali', 'Muradpur', 'Bakalia',
    'Hathazari', 'Raozan', 'Patiya', 'Sitakunda', 'Mirsharai', 'Anwara'
  ],
  "Cox's Bazar": ["Cox's Bazar Sadar", 'Chakaria', 'Teknaf', 'Ukhiya', 'Ramu', 'Maheshkhali'],
  Comilla: ['Comilla Sadar', 'Kandirpar', 'Kotbari', 'Laksam', 'Daudkandi', 'Chandina', 'Debidwar', 'Muradnagar'],
  Feni: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Sonagazi'],
  Brahmanbaria: ['Brahmanbaria Sadar', 'Ashuganj', 'Kasba', 'Nabinagar', 'Sarail'],
  Noakhali: ['Maijdee / Noakhali Sadar', 'Begumganj', 'Chowmuhani', 'Chatkhil', 'Companiganj', 'Senbagh'],
  Sylhet: [
    'Zindabazar', 'Amberkhana', 'Shahjalal Upashahar', 'Subidbazar',
    'Shibganj', 'Tilagarh', 'Kumarpara', 'Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Companiganj'
  ],
  Moulvibazar: ['Moulvibazar Sadar', 'Sreemangal', 'Kulaura', 'Kamalganj', 'Barlekha'],
  Habiganj: ['Habiganj Sadar', 'Bahubal', 'Chunarughat', 'Madhabpur', 'Nabiganj'],
  Sunamganj: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Tahirpur'],
  Rajshahi: [
    'Shaheb Bazar', 'Motihar / RU Area', 'Kazihata', 'Uposhohor', 'Talaimari',
    'Rajpara', 'Boalia', 'Paba', 'Godagari', 'Bagha', 'Charghat'
  ],
  Bogra: ['Bogra Sadar', 'Satmatha', 'Sherpur', 'Shibganj', 'Kahalu', 'Gabtali'],
  Pabna: ['Pabna Sadar', 'Ishwardi', 'Bera', 'Santhia', 'Sujanagar'],
  Sirajganj: ['Sirajganj Sadar', 'Ullapara', 'Shahjadpur', 'Belkuchi', 'Kazipur'],
  Khulna: [
    'Shibbari', 'Daulatpur', 'Sonadanga', 'Boyra', 'Khalishpur',
    'Khulna Sadar', 'Dumuria', 'Batiaghata', 'Rupsha', 'Phultala'
  ],
  Jessore: ['Jessore Sadar', 'Chaugachha', 'Jhikargachha', 'Sharsha', 'Benapole', 'Abhaynagar'],
  Kushtia: ['Kushtia Sadar', 'Kumarkhali', 'Bheramara', 'Mirpur', 'Daulatpur'],
  Barisal: ['Barisal Sadar', 'Sadar Road', 'Rupatali', 'Nathullabad', 'Babuganj', 'Bakerganj', 'Gournadi'],
  Rangpur: ['Rangpur Sadar', 'Jahaj Company More', 'Begum Rokeya University Area', 'Mithapukur', 'Pirganj', 'Badarganj'],
  Dinajpur: ['Dinajpur Sadar', 'Birganj', 'Parbatipur', 'Phulbari', 'Chirirbandar'],
  Mymensingh: ['Mymensingh Sadar', 'Town Hall / Ganginarpar', 'BAU Campus', 'Trishal', 'Bhaluka', 'Muktagachha', 'Gaffargaon']
};

export function getAreasOrUpazilas(district: string): string[] {
  if (POPULAR_AREAS_BY_DISTRICT[district]) {
    return POPULAR_AREAS_BY_DISTRICT[district];
  }
  return [`${district} Sadar`, `${district} Town / Pourashava`, 'Online / Remote'];
}

export const POPULAR_UNIVERSITIES = [
  'BUET (Bangladesh Univ of Engineering & Technology)',
  'University of Dhaka (DU)',
  'Dhaka Medical College (DMC)',
  'Shaheed Suhrawardy Medical College',
  'Sir Salimullah Medical College (SSMC)',
  'IUT (Islamic University of Technology)',
  'RUET (Rajshahi Univ of Engineering & Technology)',
  'CUET (Chittagong Univ of Engineering & Technology)',
  'KUET (Khulna Univ of Engineering & Technology)',
  'SUST (Shahjalal Univ of Science & Technology)',
  'Jahangirnagar University (JU)',
  'Rajshahi University (RU)',
  'Chittagong University (CU)',
  'Khulna University (KU)',
  'Jagannath University (JnU)',
  'North South University (NSU)',
  'BRAC University',
  'Ahsanullah University (AUST)',
  'Independent University (IUB)',
  'East West University (EWU)',
  'BUP (Bangladesh University of Professionals)',
  'National University (NU)'
];

export const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year (Medical)',
  'Masters / Postgrad',
  'Graduate / Alumni'
] as const;

export const EDUCATION_MEDIUMS = [
  'Bangla Medium',
  'English Version',
  'English Medium',
  'Madrasa',
  'Other'
] as const;

export const CURRICULUM_SYSTEMS = [
  'National Curriculum (NCTB)',
  'Cambridge / Edexcel',
  'IB',
  'Madrasa Board',
  'University / Admission',
  'Other'
] as const;

export const CLASS_GRADES = [
  'Play / Nursery / KG',
  'Class 1 - 5 (Primary)',
  'Class 6 - 8 (Junior)',
  'Class 9 - 10 (SSC)',
  'Class 11 - 12 (HSC)',
  'Engineering Admission (BUET / CKET)',
  'Medical Admission (MBBS)',
  'Varsity Admission (DU Ka / Kha / Ga)',
  'O Level / IGCSE',
  'A Level (Edexcel / Cambridge)',
  'University Courses / Programming',
  'Spoken English / IELTS'
];

export const POPULAR_SUBJECTS = [
  'Higher Mathematics',
  'General Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English Language & Grammar',
  'Bangla',
  'ICT (Information & Communication Tech)',
  'Accounting',
  'Finance & Banking',
  'Economics',
  'Business Studies',
  'Statistics',
  'Science (Class 6-8)',
  'Bangladesh & Global Studies (BGS)',
  'Islamic Studies / Arabic',
  'Computer Science / Programming',
  'All Subjects (Class 1-5)'
];

export const TUITION_TYPES = [
  'Home Tuition',
  'Online 1-on-1',
  'Group Tuition',
  'Coaching / Small Group'
] as const;

export const PREFERRED_CONTACT_METHODS = [
  'WhatsApp',
  'Phone Call',
  'Platform Proposal First'
] as const;

// Quick English / Bangla dictionary for bilingual toggle
export const TRANSLATIONS = {
  en: {
    brandTagline: 'Bangladesh’s Premier Verified Tuition Marketplace',
    findTutors: 'Find Tutors',
    tuitionJobs: 'Tuition Jobs',
    howItWorks: 'How It Works',
    pricing: 'Pricing',
    postTuition: 'Post Tuition',
    dashboard: 'Dashboard',
    searchPlaceholder: 'Search by subject, class, or area (e.g. HSC Physics Dhanmondi)...',
    verifiedTutorBadge: 'Verified Tutor',
    institutionBadge: 'Campus Verified',
    perMonth: '/ month',
    daysWeek: 'days / week',
    applyProposal: 'Send Proposal',
    inviteTutor: 'Invite to Teach',
    shortlist: 'Shortlist',
    filterByDistrict: 'District',
    filterByArea: 'Area',
    filterByMedium: 'Curriculum',
    filterByClass: 'Class / Level',
    filterBySubject: 'Subject',
    filterByGender: 'Gender Preference',
    budgetBDT: 'Monthly Budget (BDT)',
    currencySymbol: '৳',
  },
  bn: {
    brandTagline: 'বাংলাদেশের বিশ্বস্ত ভেরিফাইড টিউশন ও লার্নিং প্ল্যাটফর্ম',
    findTutors: 'টিউটর খুঁজুন',
    tuitionJobs: 'টিউশন জবস',
    howItWorks: 'কীভাবে কাজ করে',
    pricing: 'প্রাইসিং',
    postTuition: 'টিউশন পোস্ট করুন',
    dashboard: 'ড্যাশবোর্ড',
    searchPlaceholder: 'বিষয়, ক্লাস বা এলাকা লিখে খুঁজুন (যেমন: HSC পদার্থবিজ্ঞান ধানমন্ডি)...',
    verifiedTutorBadge: 'ভেরিফাইড টিউটর',
    institutionBadge: 'ক্যাম্পাস ভেরিফাইড',
    perMonth: '/ মাস',
    daysWeek: 'দিন / সপ্তাহ',
    applyProposal: 'প্রস্তাব পাঠান',
    inviteTutor: 'আমন্ত্রণ জানান',
    shortlist: 'শর্টলিস্ট',
    filterByDistrict: 'জেলা',
    filterByArea: 'এলাকা',
    filterByMedium: 'মাধ্যম',
    filterByClass: 'শ্রেণি / স্তর',
    filterBySubject: 'বিষয়',
    filterByGender: 'শিক্ষক পছন্দ',
    budgetBDT: 'মাসিক বাজেট (টাকা)',
    currencySymbol: '৳',
  }
};
