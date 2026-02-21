export interface CountryCode {
  code: string;
  name: string;
  prefix: string;
  placeholder: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  // Central Europe (priority)
  { code: 'SK', name: 'Slovakia', prefix: '+421', placeholder: '912 345 678' },
  { code: 'CZ', name: 'Czech Republic', prefix: '+420', placeholder: '601 234 567' },
  { code: 'AT', name: 'Austria', prefix: '+43', placeholder: '664 1234567' },
  { code: 'DE', name: 'Germany', prefix: '+49', placeholder: '151 23456789' },
  { code: 'PL', name: 'Poland', prefix: '+48', placeholder: '601 234 567' },
  { code: 'HU', name: 'Hungary', prefix: '+36', placeholder: '20 123 4567' },
  { code: 'CH', name: 'Switzerland', prefix: '+41', placeholder: '78 123 45 67' },

  // Western Europe
  { code: 'GB', name: 'United Kingdom', prefix: '+44', placeholder: '7400 123456' },
  { code: 'FR', name: 'France', prefix: '+33', placeholder: '6 12 34 56 78' },
  { code: 'ES', name: 'Spain', prefix: '+34', placeholder: '612 34 56 78' },
  { code: 'IT', name: 'Italy', prefix: '+39', placeholder: '312 345 6789' },
  { code: 'NL', name: 'Netherlands', prefix: '+31', placeholder: '6 12345678' },
  { code: 'BE', name: 'Belgium', prefix: '+32', placeholder: '470 12 34 56' },
  { code: 'PT', name: 'Portugal', prefix: '+351', placeholder: '912 345 678' },
  { code: 'IE', name: 'Ireland', prefix: '+353', placeholder: '85 123 4567' },
  { code: 'LU', name: 'Luxembourg', prefix: '+352', placeholder: '628 123 456' },

  // Northern Europe
  { code: 'SE', name: 'Sweden', prefix: '+46', placeholder: '70 123 45 67' },
  { code: 'NO', name: 'Norway', prefix: '+47', placeholder: '406 12 345' },
  { code: 'DK', name: 'Denmark', prefix: '+45', placeholder: '32 12 34 56' },
  { code: 'FI', name: 'Finland', prefix: '+358', placeholder: '40 1234567' },
  { code: 'IS', name: 'Iceland', prefix: '+354', placeholder: '611 1234' },

  // Southeastern Europe
  { code: 'GR', name: 'Greece', prefix: '+30', placeholder: '691 234 5678' },
  { code: 'RO', name: 'Romania', prefix: '+40', placeholder: '712 345 678' },
  { code: 'BG', name: 'Bulgaria', prefix: '+359', placeholder: '87 123 4567' },
  { code: 'HR', name: 'Croatia', prefix: '+385', placeholder: '91 234 5678' },
  { code: 'RS', name: 'Serbia', prefix: '+381', placeholder: '60 1234567' },
  { code: 'SI', name: 'Slovenia', prefix: '+386', placeholder: '31 234 567' },
  { code: 'BA', name: 'Bosnia and Herzegovina', prefix: '+387', placeholder: '61 234 567' },
  { code: 'ME', name: 'Montenegro', prefix: '+382', placeholder: '67 123 456' },
  { code: 'MK', name: 'North Macedonia', prefix: '+389', placeholder: '72 123 456' },
  { code: 'AL', name: 'Albania', prefix: '+355', placeholder: '66 123 4567' },
  { code: 'XK', name: 'Kosovo', prefix: '+383', placeholder: '44 123 456' },
  { code: 'CY', name: 'Cyprus', prefix: '+357', placeholder: '96 123456' },
  { code: 'MT', name: 'Malta', prefix: '+356', placeholder: '7912 3456' },

  // Eastern Europe
  { code: 'UA', name: 'Ukraine', prefix: '+380', placeholder: '50 123 4567' },
  { code: 'RU', name: 'Russia', prefix: '+7', placeholder: '912 345-67-89' },
  { code: 'BY', name: 'Belarus', prefix: '+375', placeholder: '25 123-45-67' },
  { code: 'MD', name: 'Moldova', prefix: '+373', placeholder: '621 12 345' },
  { code: 'GE', name: 'Georgia', prefix: '+995', placeholder: '555 12 34 56' },

  // Baltic states
  { code: 'LT', name: 'Lithuania', prefix: '+370', placeholder: '612 34567' },
  { code: 'LV', name: 'Latvia', prefix: '+371', placeholder: '21 234 567' },
  { code: 'EE', name: 'Estonia', prefix: '+372', placeholder: '5123 4567' },

  // North America
  { code: 'US', name: 'United States', prefix: '+1', placeholder: '(555) 123-4567' },
  { code: 'CA', name: 'Canada', prefix: '+1', placeholder: '(555) 123-4567' },

  // Latin America
  { code: 'BR', name: 'Brazil', prefix: '+55', placeholder: '11 91234-5678' },
  { code: 'MX', name: 'Mexico', prefix: '+52', placeholder: '55 1234 5678' },
  { code: 'AR', name: 'Argentina', prefix: '+54', placeholder: '11 2345-6789' },
  { code: 'CL', name: 'Chile', prefix: '+56', placeholder: '9 1234 5678' },
  { code: 'CO', name: 'Colombia', prefix: '+57', placeholder: '321 1234567' },
  { code: 'PE', name: 'Peru', prefix: '+51', placeholder: '912 345 678' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', placeholder: '412-1234567' },

  // Middle East
  { code: 'TR', name: 'Turkey', prefix: '+90', placeholder: '532 123 4567' },
  { code: 'IL', name: 'Israel', prefix: '+972', placeholder: '50-123-4567' },
  { code: 'AE', name: 'United Arab Emirates', prefix: '+971', placeholder: '50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', prefix: '+966', placeholder: '50 123 4567' },
  { code: 'QA', name: 'Qatar', prefix: '+974', placeholder: '3312 3456' },

  // Africa
  { code: 'ZA', name: 'South Africa', prefix: '+27', placeholder: '71 123 4567' },
  { code: 'EG', name: 'Egypt', prefix: '+20', placeholder: '100 123 4567' },
  { code: 'NG', name: 'Nigeria', prefix: '+234', placeholder: '802 123 4567' },
  { code: 'KE', name: 'Kenya', prefix: '+254', placeholder: '712 345678' },
  { code: 'MA', name: 'Morocco', prefix: '+212', placeholder: '612-345678' },

  // East Asia
  { code: 'JP', name: 'Japan', prefix: '+81', placeholder: '90-1234-5678' },
  { code: 'KR', name: 'South Korea', prefix: '+82', placeholder: '10-1234-5678' },
  { code: 'CN', name: 'China', prefix: '+86', placeholder: '131 2345 6789' },
  { code: 'HK', name: 'Hong Kong', prefix: '+852', placeholder: '5123 4567' },
  { code: 'TW', name: 'Taiwan', prefix: '+886', placeholder: '912 345 678' },

  // Southeast Asia
  { code: 'SG', name: 'Singapore', prefix: '+65', placeholder: '8123 4567' },
  { code: 'MY', name: 'Malaysia', prefix: '+60', placeholder: '12-345 6789' },
  { code: 'TH', name: 'Thailand', prefix: '+66', placeholder: '81 234 5678' },
  { code: 'VN', name: 'Vietnam', prefix: '+84', placeholder: '91 234 5678' },
  { code: 'PH', name: 'Philippines', prefix: '+63', placeholder: '905 123 4567' },
  { code: 'ID', name: 'Indonesia', prefix: '+62', placeholder: '812-3456-7890' },

  // South Asia
  { code: 'IN', name: 'India', prefix: '+91', placeholder: '81234 56789' },
  { code: 'PK', name: 'Pakistan', prefix: '+92', placeholder: '300 1234567' },
  { code: 'BD', name: 'Bangladesh', prefix: '+880', placeholder: '1812-345678' },
  { code: 'LK', name: 'Sri Lanka', prefix: '+94', placeholder: '71 234 5678' },

  // Oceania
  { code: 'AU', name: 'Australia', prefix: '+61', placeholder: '412 345 678' },
  { code: 'NZ', name: 'New Zealand', prefix: '+64', placeholder: '21 123 4567' },
];
