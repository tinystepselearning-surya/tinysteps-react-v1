const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
const DIGITS_ONLY_REGEX = /^\d+$/;

// Global legacy fallback for parent records that predate canonical ISO countryCode.
// Canonical countryCode always wins. Shared calling codes deliberately resolve to
// the most common territory unless a more specific NANP rule applies.
const CALLING_CODE_DATA = `1242:BS;1246:BB;1264:AI;1268:AG;1284:VG;1340:VI;1345:KY;1441:BM;1473:GD;1649:TC;1664:MS;1670:MP;1671:GU;1684:AS;1721:SX;1758:LC;1767:DM;1784:VC;1787:PR;1809:DO;1829:DO;1849:DO;1868:TT;1869:KN;1876:JM;1939:PR;4779:SJ;211:SS;212:MA;213:DZ;216:TN;218:LY;220:GM;221:SN;222:MR;223:ML;224:GN;225:CI;226:BF;227:NE;228:TG;229:BJ;230:MU;231:LR;232:SL;233:GH;234:NG;235:TD;236:CF;237:CM;238:CV;239:ST;240:GQ;241:GA;242:CG;243:CD;244:AO;245:GW;246:IO;248:SC;249:SD;250:RW;251:ET;252:SO;253:DJ;254:KE;255:TZ;256:UG;257:BI;258:MZ;260:ZM;261:MG;262:RE;263:ZW;264:NA;265:MW;266:LS;267:BW;268:SZ;269:KM;290:SH;291:ER;297:AW;298:FO;299:GL;350:GI;351:PT;352:LU;353:IE;354:IS;355:AL;356:MT;357:CY;358:FI;359:BG;370:LT;371:LV;372:EE;373:MD;374:AM;375:BY;376:AD;377:MC;378:SM;380:UA;381:RS;382:ME;385:HR;386:SI;387:BA;420:CZ;421:SK;423:LI;500:FK;501:BZ;502:GT;503:SV;504:HN;505:NI;506:CR;507:PA;508:PM;509:HT;590:GP;591:BO;592:GY;593:EC;594:GF;595:PY;596:MQ;597:SR;598:UY;599:CW;670:TL;672:NF;673:BN;674:NR;675:PG;676:TO;677:SB;678:VU;679:FJ;680:PW;681:WF;682:CK;683:NU;685:WS;686:KI;687:NC;688:TV;689:PF;690:TK;691:FM;692:MH;850:KP;852:HK;853:MO;855:KH;856:LA;880:BD;886:TW;960:MV;961:LB;962:JO;963:SY;964:IQ;965:KW;966:SA;967:YE;968:OM;970:PS;971:AE;972:IL;973:BH;974:QA;975:BT;976:MN;977:NP;992:TJ;993:TM;994:AZ;995:GE;996:KG;998:UZ;20:EG;27:ZA;30:GR;31:NL;32:BE;33:FR;34:ES;36:HU;39:IT;40:RO;41:CH;43:AT;44:GB;45:DK;46:SE;47:NO;48:PL;49:DE;51:PE;52:MX;53:CU;54:AR;55:BR;56:CL;57:CO;58:VE;60:MY;61:AU;62:ID;63:PH;64:NZ;65:SG;66:TH;76:KZ;77:KZ;81:JP;82:KR;84:VN;86:CN;90:TR;91:IN;92:PK;93:AF;94:LK;95:MM;98:IR;7:RU`;

const CALLING_CODE_TO_ISO = new Map(
  CALLING_CODE_DATA.split(';').map((entry) => {
    const [callingCode, iso] = entry.split(':');
    return [callingCode, iso] as const;
  }),
);

// Current Canadian geographic NPAs. +1 is shared across the NANP, so the
// subscriber area code is required to distinguish Canada from the US.
const CANADIAN_NPAS = new Set([
  '204', '226', '236', '249', '250', '257', '263', '273', '289', '306',
  '343', '354', '365', '367', '368', '382', '403', '416', '418', '428',
  '431', '437', '438', '450', '468', '474', '506', '514', '519', '548',
  '579', '581', '584', '587', '604', '613', '639', '647', '672', '683',
  '705', '709', '742', '753', '778', '780', '782', '807', '819', '825',
  '867', '873', '879', '902', '905', '942',
]);

const NANP_NPA_TO_ISO = new Map<string, string>();
for (const [callingCode, iso] of CALLING_CODE_TO_ISO.entries()) {
  if (callingCode.length === 4 && callingCode.startsWith('1')) {
    NANP_NPA_TO_ISO.set(callingCode.slice(1), iso);
  }
}
for (const areaCode of CANADIAN_NPAS) {
  NANP_NPA_TO_ISO.set(areaCode, 'CA');
}

export type ParentCountryResolutionSource =
  | 'iso'
  | 'phone-country-code'
  | 'full-phone'
  | null;

export type ParentCountryResolutionResult = {
  countryCode: string | null;
  source: ParentCountryResolutionSource;
  unmappedPhoneCountryCode: string | null;
};

export function normalizeIsoCountryCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return COUNTRY_CODE_REGEX.test(normalized) ? normalized : null;
}

function normalizeDigits(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\D/g, '');
}

function normalizeInternationalDigits(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let compact = trimmed.replace(/[\s\-()]/g, '');
  if (compact.startsWith('+')) compact = compact.slice(1);
  else if (compact.startsWith('00')) {
    while (compact.startsWith('00')) compact = compact.slice(2);
  } else {
    return null;
  }

  return compact && DIGITS_ONLY_REGEX.test(compact) ? compact : null;
}

function resolveNanp(localDigits: string): string {
  const areaCode = localDigits.slice(0, 3);
  return NANP_NPA_TO_ISO.get(areaCode) || 'US';
}

function resolveFromCallingCode(callingCodeDigits: string, localDigits: string): string | null {
  if (callingCodeDigits === '1') {
    return resolveNanp(localDigits);
  }
  return CALLING_CODE_TO_ISO.get(callingCodeDigits) || null;
}

function resolveFromFullInternationalPhone(phone: unknown): string | null {
  const digits = normalizeInternationalDigits(phone);
  if (!digits) return null;

  if (digits.startsWith('1') && digits.length >= 11) {
    return resolveNanp(digits.slice(1));
  }

  const candidates = Array.from(CALLING_CODE_TO_ISO.keys()).sort((a, b) => b.length - a.length);
  for (const callingCode of candidates) {
    if (digits.startsWith(callingCode)) {
      return CALLING_CODE_TO_ISO.get(callingCode) || null;
    }
  }
  return null;
}

export function resolveCountryFromParentDoc(data: Record<string, unknown>): ParentCountryResolutionResult {
  const canonicalCountry = normalizeIsoCountryCode(data.countryCode);
  if (canonicalCountry) {
    return { countryCode: canonicalCountry, source: 'iso', unmappedPhoneCountryCode: null };
  }

  if (typeof data.phoneCountryCode === 'string') {
    const raw = data.phoneCountryCode.trim();
    const isoCandidate = normalizeIsoCountryCode(raw);
    if (isoCandidate) {
      return { countryCode: isoCandidate, source: 'phone-country-code', unmappedPhoneCountryCode: null };
    }

    const callingCodeDigits = normalizeDigits(raw);
    if (callingCodeDigits) {
      const localDigits = normalizeDigits(data.phoneLocal) || (() => {
        const fullDigits = normalizeInternationalDigits(data.phone);
        if (!fullDigits || !fullDigits.startsWith(callingCodeDigits)) return '';
        return fullDigits.slice(callingCodeDigits.length);
      })();
      const resolved = resolveFromCallingCode(callingCodeDigits, localDigits);
      if (resolved) {
        return { countryCode: resolved, source: 'phone-country-code', unmappedPhoneCountryCode: null };
      }
      return {
        countryCode: null,
        source: null,
        unmappedPhoneCountryCode: callingCodeDigits.length <= 4 ? `+${callingCodeDigits}` : '__NON_CODE_NUMERIC__',
      };
    }
  }

  const fromFullPhone = resolveFromFullInternationalPhone(data.phone);
  if (fromFullPhone) {
    return { countryCode: fromFullPhone, source: 'full-phone', unmappedPhoneCountryCode: null };
  }

  return { countryCode: null, source: null, unmappedPhoneCountryCode: null };
}

export function resolveCountryName(countryCode: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}
