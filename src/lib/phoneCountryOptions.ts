export interface PhoneCountryOption {
  id: string;
  name: string;
  code: string;
  label: string;
  aliases?: readonly string[];
}

type RawPhoneCountryOption = Omit<PhoneCountryOption, 'label'>;

const RAW_PHONE_COUNTRY_OPTIONS: readonly RawPhoneCountryOption[] = [
  { id: 'AF', name: 'Afghanistan', code: '+93' },
  { id: 'AL', name: 'Albania', code: '+355' },
  { id: 'DZ', name: 'Algeria', code: '+213' },
  { id: 'AS', name: 'American Samoa', code: '+1' },
  { id: 'AD', name: 'Andorra', code: '+376' },
  { id: 'AO', name: 'Angola', code: '+244' },
  { id: 'AI', name: 'Anguilla', code: '+1' },
  { id: 'AQ', name: 'Antarctica', code: '+672' },
  { id: 'AG', name: 'Antigua and Barbuda', code: '+1' },
  { id: 'AR', name: 'Argentina', code: '+54' },
  { id: 'AM', name: 'Armenia', code: '+374' },
  { id: 'AW', name: 'Aruba', code: '+297' },
  { id: 'AU', name: 'Australia', code: '+61' },
  { id: 'AT', name: 'Austria', code: '+43' },
  { id: 'AZ', name: 'Azerbaijan', code: '+994' },
  { id: 'BS', name: 'Bahamas', code: '+1' },
  { id: 'BH', name: 'Bahrain', code: '+973' },
  { id: 'BD', name: 'Bangladesh', code: '+880' },
  { id: 'BB', name: 'Barbados', code: '+1' },
  { id: 'BY', name: 'Belarus', code: '+375' },
  { id: 'BE', name: 'Belgium', code: '+32' },
  { id: 'BZ', name: 'Belize', code: '+501' },
  { id: 'BJ', name: 'Benin', code: '+229' },
  { id: 'BM', name: 'Bermuda', code: '+1' },
  { id: 'BT', name: 'Bhutan', code: '+975' },
  { id: 'BO', name: 'Bolivia', code: '+591' },
  { id: 'BQ', name: 'Bonaire, Sint Eustatius and Saba', code: '+599', aliases: ['Caribbean Netherlands'] },
  { id: 'BA', name: 'Bosnia and Herzegovina', code: '+387', aliases: ['Bosnia'] },
  { id: 'BW', name: 'Botswana', code: '+267' },
  { id: 'BR', name: 'Brazil', code: '+55' },
  { id: 'IO', name: 'British Indian Ocean Territory', code: '+246' },
  { id: 'VG', name: 'British Virgin Islands', code: '+1' },
  { id: 'BN', name: 'Brunei', code: '+673', aliases: ['Brunei Darussalam'] },
  { id: 'BG', name: 'Bulgaria', code: '+359' },
  { id: 'BF', name: 'Burkina Faso', code: '+226' },
  { id: 'BI', name: 'Burundi', code: '+257' },
  { id: 'CV', name: 'Cabo Verde', code: '+238', aliases: ['Cape Verde'] },
  { id: 'KH', name: 'Cambodia', code: '+855' },
  { id: 'CM', name: 'Cameroon', code: '+237' },
  { id: 'CA', name: 'Canada', code: '+1' },
  { id: 'KY', name: 'Cayman Islands', code: '+1' },
  { id: 'CF', name: 'Central African Republic', code: '+236' },
  { id: 'TD', name: 'Chad', code: '+235' },
  { id: 'CL', name: 'Chile', code: '+56' },
  { id: 'CN', name: 'China', code: '+86', aliases: ['PRC'] },
  { id: 'CX', name: 'Christmas Island', code: '+61' },
  { id: 'CC', name: 'Cocos (Keeling) Islands', code: '+61', aliases: ['Cocos Islands'] },
  { id: 'CO', name: 'Colombia', code: '+57' },
  { id: 'KM', name: 'Comoros', code: '+269' },
  { id: 'CG', name: 'Congo', code: '+242', aliases: ['Republic of the Congo', 'Congo-Brazzaville'] },
  { id: 'CD', name: 'Congo, Democratic Republic of the', code: '+243', aliases: ['DR Congo', 'DRC', 'Congo-Kinshasa'] },
  { id: 'CK', name: 'Cook Islands', code: '+682' },
  { id: 'CR', name: 'Costa Rica', code: '+506' },
  { id: 'CI', name: "Cote d'Ivoire", code: '+225', aliases: ['Ivory Coast', 'Côte d’Ivoire', "Côte d'Ivoire"] },
  { id: 'HR', name: 'Croatia', code: '+385' },
  { id: 'CU', name: 'Cuba', code: '+53' },
  { id: 'CW', name: 'Curacao', code: '+599', aliases: ['Curaçao'] },
  { id: 'CY', name: 'Cyprus', code: '+357' },
  { id: 'CZ', name: 'Czechia', code: '+420', aliases: ['Czech Republic'] },
  { id: 'DK', name: 'Denmark', code: '+45' },
  { id: 'DJ', name: 'Djibouti', code: '+253' },
  { id: 'DM', name: 'Dominica', code: '+1' },
  { id: 'DO', name: 'Dominican Republic', code: '+1' },
  { id: 'EC', name: 'Ecuador', code: '+593' },
  { id: 'EG', name: 'Egypt', code: '+20' },
  { id: 'SV', name: 'El Salvador', code: '+503' },
  { id: 'GQ', name: 'Equatorial Guinea', code: '+240' },
  { id: 'ER', name: 'Eritrea', code: '+291' },
  { id: 'EE', name: 'Estonia', code: '+372' },
  { id: 'SZ', name: 'Eswatini', code: '+268', aliases: ['Swaziland'] },
  { id: 'ET', name: 'Ethiopia', code: '+251' },
  { id: 'FK', name: 'Falkland Islands', code: '+500', aliases: ['Malvinas'] },
  { id: 'FO', name: 'Faroe Islands', code: '+298' },
  { id: 'FJ', name: 'Fiji', code: '+679' },
  { id: 'FI', name: 'Finland', code: '+358' },
  { id: 'FR', name: 'France', code: '+33' },
  { id: 'GF', name: 'French Guiana', code: '+594' },
  { id: 'PF', name: 'French Polynesia', code: '+689' },
  { id: 'GA', name: 'Gabon', code: '+241' },
  { id: 'GM', name: 'Gambia', code: '+220' },
  { id: 'GE', name: 'Georgia', code: '+995' },
  { id: 'DE', name: 'Germany', code: '+49' },
  { id: 'GH', name: 'Ghana', code: '+233' },
  { id: 'GI', name: 'Gibraltar', code: '+350' },
  { id: 'GR', name: 'Greece', code: '+30' },
  { id: 'GL', name: 'Greenland', code: '+299' },
  { id: 'GD', name: 'Grenada', code: '+1' },
  { id: 'GP', name: 'Guadeloupe', code: '+590' },
  { id: 'GU', name: 'Guam', code: '+1' },
  { id: 'GT', name: 'Guatemala', code: '+502' },
  { id: 'GG', name: 'Guernsey', code: '+44' },
  { id: 'GN', name: 'Guinea', code: '+224' },
  { id: 'GW', name: 'Guinea-Bissau', code: '+245' },
  { id: 'GY', name: 'Guyana', code: '+592' },
  { id: 'HT', name: 'Haiti', code: '+509' },
  { id: 'VA', name: 'Holy See (Vatican City)', code: '+39', aliases: ['Vatican', 'Vatican City'] },
  { id: 'HN', name: 'Honduras', code: '+504' },
  { id: 'HK', name: 'Hong Kong', code: '+852', aliases: ['Hong Kong SAR'] },
  { id: 'HU', name: 'Hungary', code: '+36' },
  { id: 'IS', name: 'Iceland', code: '+354' },
  { id: 'IN', name: 'India', code: '+91', aliases: ['Bharat'] },
  { id: 'ID', name: 'Indonesia', code: '+62' },
  { id: 'IR', name: 'Iran', code: '+98', aliases: ['Islamic Republic of Iran'] },
  { id: 'IQ', name: 'Iraq', code: '+964' },
  { id: 'IE', name: 'Ireland', code: '+353', aliases: ['Republic of Ireland'] },
  { id: 'IM', name: 'Isle of Man', code: '+44' },
  { id: 'IL', name: 'Israel', code: '+972' },
  { id: 'IT', name: 'Italy', code: '+39' },
  { id: 'JM', name: 'Jamaica', code: '+1' },
  { id: 'JP', name: 'Japan', code: '+81' },
  { id: 'JE', name: 'Jersey', code: '+44' },
  { id: 'JO', name: 'Jordan', code: '+962' },
  { id: 'KZ', name: 'Kazakhstan', code: '+7' },
  { id: 'KE', name: 'Kenya', code: '+254' },
  { id: 'KI', name: 'Kiribati', code: '+686' },
  { id: 'KP', name: 'Korea, North', code: '+850', aliases: ['North Korea', 'DPRK'] },
  { id: 'KR', name: 'Korea, South', code: '+82', aliases: ['South Korea', 'Republic of Korea'] },
  { id: 'XK', name: 'Kosovo', code: '+383' },
  { id: 'KW', name: 'Kuwait', code: '+965' },
  { id: 'KG', name: 'Kyrgyzstan', code: '+996' },
  { id: 'LA', name: 'Laos', code: '+856', aliases: ['Lao PDR'] },
  { id: 'LV', name: 'Latvia', code: '+371' },
  { id: 'LB', name: 'Lebanon', code: '+961' },
  { id: 'LS', name: 'Lesotho', code: '+266' },
  { id: 'LR', name: 'Liberia', code: '+231' },
  { id: 'LY', name: 'Libya', code: '+218' },
  { id: 'LI', name: 'Liechtenstein', code: '+423' },
  { id: 'LT', name: 'Lithuania', code: '+370' },
  { id: 'LU', name: 'Luxembourg', code: '+352' },
  { id: 'MO', name: 'Macao', code: '+853', aliases: ['Macau', 'Macao SAR'] },
  { id: 'MG', name: 'Madagascar', code: '+261' },
  { id: 'MW', name: 'Malawi', code: '+265' },
  { id: 'MY', name: 'Malaysia', code: '+60' },
  { id: 'MV', name: 'Maldives', code: '+960' },
  { id: 'ML', name: 'Mali', code: '+223' },
  { id: 'MT', name: 'Malta', code: '+356' },
  { id: 'MH', name: 'Marshall Islands', code: '+692' },
  { id: 'MQ', name: 'Martinique', code: '+596' },
  { id: 'MR', name: 'Mauritania', code: '+222' },
  { id: 'MU', name: 'Mauritius', code: '+230' },
  { id: 'YT', name: 'Mayotte', code: '+262' },
  { id: 'MX', name: 'Mexico', code: '+52' },
  { id: 'FM', name: 'Micronesia', code: '+691', aliases: ['Federated States of Micronesia'] },
  { id: 'MD', name: 'Moldova', code: '+373', aliases: ['Republic of Moldova'] },
  { id: 'MC', name: 'Monaco', code: '+377' },
  { id: 'MN', name: 'Mongolia', code: '+976' },
  { id: 'ME', name: 'Montenegro', code: '+382' },
  { id: 'MS', name: 'Montserrat', code: '+1' },
  { id: 'MA', name: 'Morocco', code: '+212' },
  { id: 'MZ', name: 'Mozambique', code: '+258' },
  { id: 'MM', name: 'Myanmar', code: '+95', aliases: ['Burma'] },
  { id: 'NA', name: 'Namibia', code: '+264' },
  { id: 'NR', name: 'Nauru', code: '+674' },
  { id: 'NP', name: 'Nepal', code: '+977' },
  { id: 'NL', name: 'Netherlands', code: '+31', aliases: ['Holland'] },
  { id: 'NC', name: 'New Caledonia', code: '+687' },
  { id: 'NZ', name: 'New Zealand', code: '+64' },
  { id: 'NI', name: 'Nicaragua', code: '+505' },
  { id: 'NE', name: 'Niger', code: '+227' },
  { id: 'NG', name: 'Nigeria', code: '+234' },
  { id: 'NU', name: 'Niue', code: '+683' },
  { id: 'NF', name: 'Norfolk Island', code: '+672' },
  { id: 'MK', name: 'North Macedonia', code: '+389', aliases: ['Macedonia'] },
  { id: 'MP', name: 'Northern Mariana Islands', code: '+1' },
  { id: 'NO', name: 'Norway', code: '+47' },
  { id: 'OM', name: 'Oman', code: '+968' },
  { id: 'PK', name: 'Pakistan', code: '+92' },
  { id: 'PW', name: 'Palau', code: '+680' },
  { id: 'PS', name: 'Palestine', code: '+970', aliases: ['Palestinian Territories', 'State of Palestine'] },
  { id: 'PA', name: 'Panama', code: '+507' },
  { id: 'PG', name: 'Papua New Guinea', code: '+675' },
  { id: 'PY', name: 'Paraguay', code: '+595' },
  { id: 'PE', name: 'Peru', code: '+51' },
  { id: 'PH', name: 'Philippines', code: '+63' },
  { id: 'PN', name: 'Pitcairn', code: '+64', aliases: ['Pitcairn Islands'] },
  { id: 'PL', name: 'Poland', code: '+48' },
  { id: 'PT', name: 'Portugal', code: '+351' },
  { id: 'PR', name: 'Puerto Rico', code: '+1' },
  { id: 'QA', name: 'Qatar', code: '+974' },
  { id: 'RE', name: 'Reunion', code: '+262', aliases: ['Réunion'] },
  { id: 'RO', name: 'Romania', code: '+40' },
  { id: 'RU', name: 'Russia', code: '+7', aliases: ['Russian Federation'] },
  { id: 'RW', name: 'Rwanda', code: '+250' },
  { id: 'BL', name: 'Saint Barthelemy', code: '+590', aliases: ['Saint Barthélemy', 'St Barthelemy'] },
  { id: 'SH', name: 'Saint Helena', code: '+290' },
  { id: 'KN', name: 'Saint Kitts and Nevis', code: '+1' },
  { id: 'LC', name: 'Saint Lucia', code: '+1' },
  { id: 'MF', name: 'Saint Martin', code: '+590', aliases: ['French Saint Martin'] },
  { id: 'PM', name: 'Saint Pierre and Miquelon', code: '+508' },
  { id: 'VC', name: 'Saint Vincent and the Grenadines', code: '+1' },
  { id: 'WS', name: 'Samoa', code: '+685' },
  { id: 'SM', name: 'San Marino', code: '+378' },
  { id: 'ST', name: 'Sao Tome and Principe', code: '+239', aliases: ['São Tomé and Príncipe'] },
  { id: 'SA', name: 'Saudi Arabia', code: '+966', aliases: ['KSA'] },
  { id: 'SN', name: 'Senegal', code: '+221' },
  { id: 'RS', name: 'Serbia', code: '+381' },
  { id: 'SC', name: 'Seychelles', code: '+248' },
  { id: 'SL', name: 'Sierra Leone', code: '+232' },
  { id: 'SG', name: 'Singapore', code: '+65' },
  { id: 'SX', name: 'Sint Maarten', code: '+1', aliases: ['Dutch Saint Martin'] },
  { id: 'SK', name: 'Slovakia', code: '+421', aliases: ['Slovak Republic'] },
  { id: 'SI', name: 'Slovenia', code: '+386' },
  { id: 'SB', name: 'Solomon Islands', code: '+677' },
  { id: 'SO', name: 'Somalia', code: '+252' },
  { id: 'ZA', name: 'South Africa', code: '+27' },
  { id: 'SS', name: 'South Sudan', code: '+211' },
  { id: 'ES', name: 'Spain', code: '+34' },
  { id: 'LK', name: 'Sri Lanka', code: '+94' },
  { id: 'SD', name: 'Sudan', code: '+249' },
  { id: 'SR', name: 'Suriname', code: '+597' },
  { id: 'SJ', name: 'Svalbard and Jan Mayen', code: '+47' },
  { id: 'SE', name: 'Sweden', code: '+46' },
  { id: 'CH', name: 'Switzerland', code: '+41' },
  { id: 'SY', name: 'Syria', code: '+963', aliases: ['Syrian Arab Republic'] },
  { id: 'TW', name: 'Taiwan', code: '+886' },
  { id: 'TJ', name: 'Tajikistan', code: '+992' },
  { id: 'TZ', name: 'Tanzania', code: '+255', aliases: ['United Republic of Tanzania'] },
  { id: 'TH', name: 'Thailand', code: '+66' },
  { id: 'TL', name: 'Timor-Leste', code: '+670', aliases: ['East Timor'] },
  { id: 'TG', name: 'Togo', code: '+228' },
  { id: 'TK', name: 'Tokelau', code: '+690' },
  { id: 'TO', name: 'Tonga', code: '+676' },
  { id: 'TT', name: 'Trinidad and Tobago', code: '+1' },
  { id: 'TN', name: 'Tunisia', code: '+216' },
  { id: 'TR', name: 'Turkey', code: '+90', aliases: ['Türkiye', 'Turkiye'] },
  { id: 'TM', name: 'Turkmenistan', code: '+993' },
  { id: 'TC', name: 'Turks and Caicos Islands', code: '+1' },
  { id: 'TV', name: 'Tuvalu', code: '+688' },
  { id: 'UG', name: 'Uganda', code: '+256' },
  { id: 'UA', name: 'Ukraine', code: '+380' },
  { id: 'AE', name: 'United Arab Emirates', code: '+971', aliases: ['UAE'] },
  { id: 'GB', name: 'United Kingdom', code: '+44', aliases: ['UK', 'Great Britain', 'Britain', 'England'] },
  { id: 'US', name: 'United States', code: '+1', aliases: ['USA', 'US', 'America', 'United States of America'] },
  { id: 'UY', name: 'Uruguay', code: '+598' },
  { id: 'VI', name: 'US Virgin Islands', code: '+1', aliases: ['United States Virgin Islands'] },
  { id: 'UZ', name: 'Uzbekistan', code: '+998' },
  { id: 'VU', name: 'Vanuatu', code: '+678' },
  { id: 'VE', name: 'Venezuela', code: '+58' },
  { id: 'VN', name: 'Vietnam', code: '+84', aliases: ['Viet Nam'] },
  { id: 'WF', name: 'Wallis and Futuna', code: '+681' },
  { id: 'EH', name: 'Western Sahara', code: '+212' },
  { id: 'YE', name: 'Yemen', code: '+967' },
  { id: 'ZM', name: 'Zambia', code: '+260' },
  { id: 'ZW', name: 'Zimbabwe', code: '+263' },
];

export const PHONE_COUNTRY_OPTIONS: readonly PhoneCountryOption[] = RAW_PHONE_COUNTRY_OPTIONS
  .map((option) => ({
    ...option,
    label: `${option.name} (${option.code})`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

const normalizeCountrySearch = (value: string): string =>
  String(value || '').trim().toLowerCase();

const digitsOnly = (value: string): string => String(value || '').replace(/\D/g, '');

export const findPhoneCountryOptionById = (id: string): PhoneCountryOption | undefined => {
  const normalized = String(id || '').trim().toUpperCase();
  return PHONE_COUNTRY_OPTIONS.find((option) => option.id === normalized);
};

export const findPhoneCountryOptionByCallingCode = (
  callingCode: string,
  preferredCountryId?: string,
): PhoneCountryOption | undefined => {
  const normalizedCode = digitsOnly(callingCode);
  if (!normalizedCode) return undefined;
  const preferred = preferredCountryId ? findPhoneCountryOptionById(preferredCountryId) : undefined;
  if (preferred && digitsOnly(preferred.code) === normalizedCode) return preferred;
  return PHONE_COUNTRY_OPTIONS.find((option) => digitsOnly(option.code) === normalizedCode);
};

const optionSearchValues = (option: PhoneCountryOption): string[] => [
  option.name,
  option.id,
  option.label,
  ...(option.aliases || []),
].map((value) => value.toLowerCase());

const countrySearchRank = (option: PhoneCountryOption, normalized: string, queryDigits: string): number => {
  const values = optionSearchValues(option);
  const codeDigits = digitsOnly(option.code);
  if (values.some((value) => value === normalized)) return 0;
  if (queryDigits && codeDigits === queryDigits) return 1;
  if (values.some((value) => value.startsWith(normalized))) return 2;
  if (values.some((value) => value.includes(normalized))) return 3;
  if (queryDigits && codeDigits.startsWith(queryDigits)) return 4;
  if (queryDigits && codeDigits.includes(queryDigits)) return 5;
  return Number.MAX_SAFE_INTEGER;
};

export const searchPhoneCountryOptions = (query: string): PhoneCountryOption[] => {
  const normalized = normalizeCountrySearch(query);
  if (!normalized) return [...PHONE_COUNTRY_OPTIONS];
  const queryDigits = digitsOnly(normalized);

  return PHONE_COUNTRY_OPTIONS
    .map((option) => ({ option, rank: countrySearchRank(option, normalized, queryDigits) }))
    .filter(({ rank }) => rank !== Number.MAX_SAFE_INTEGER)
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.option.name.localeCompare(right.option.name, undefined, { sensitivity: 'base' });
    })
    .map(({ option }) => option);
};
