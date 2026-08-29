export type CountryCoverageMetadata = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type CountryMapPoint = {
  x: number;
  y: number;
};

const COUNTRY_DATA = `AF|Afghanistan|33.00|65.00;AL|Albania|41.00|20.00;DZ|Algeria|28.00|3.00;AS|American Samoa|-14.33|-170.00;AD|Andorra|42.55|1.58;AO|Angola|-12.50|18.50;AI|Anguilla|18.25|-63.17;AQ|Antarctica|-82.00|0.00;AG|Antigua and Barbuda|17.05|-61.80;AR|Argentina|-34.00|-64.00;AM|Armenia|40.00|45.00;AW|Aruba|12.50|-69.97;AU|Australia|-27.00|133.00;AT|Austria|47.33|13.33;AZ|Azerbaijan|40.50|47.50;BS|Bahamas|24.25|-76.00;BH|Bahrain|26.00|50.55;BD|Bangladesh|24.00|90.00;BB|Barbados|13.17|-59.53;BY|Belarus|53.00|28.00;BE|Belgium|50.83|4.00;BZ|Belize|17.25|-88.75;BJ|Benin|9.50|2.25;BM|Bermuda|32.33|-64.75;BT|Bhutan|27.50|90.50;BO|Bolivia|-17.00|-65.00;BQ|Bonaire, Sint Eustatius and Saba|12.18|-68.24;BA|Bosnia and Herzegovina|44.00|18.00;BW|Botswana|-22.00|24.00;BV|Bouvet Island|-54.42|3.41;BR|Brazil|-10.00|-55.00;IO|British Indian Ocean Territory|-6.00|71.50;VG|British Virgin Islands|18.42|-64.62;BN|Brunei Darussalam|4.50|114.67;BG|Bulgaria|43.00|25.00;BF|Burkina Faso|13.00|-2.00;BI|Burundi|-3.50|30.00;CV|Cabo Verde|16.00|-24.00;KH|Cambodia|13.00|105.00;CM|Cameroon|6.00|12.00;CA|Canada|60.00|-95.00;KY|Cayman Islands|19.50|-80.50;CF|Central African Republic|7.00|21.00;TD|Chad|15.00|19.00;CL|Chile|-30.00|-71.00;CN|China|35.00|105.00;CX|Christmas Island|-10.50|105.67;CC|Cocos (Keeling) Islands|-12.50|96.83;CO|Colombia|4.00|-72.00;KM|Comoros|-12.17|44.25;CG|Congo|-1.00|15.00;CK|Cook Islands|-21.23|-159.77;CR|Costa Rica|10.00|-84.00;HR|Croatia|45.17|15.50;CU|Cuba|21.50|-80.00;CW|Curaçao|12.17|-68.99;CY|Cyprus|35.00|33.00;CZ|Czechia|49.75|15.50;CI|Côte d'Ivoire|8.00|-5.00;CD|Democratic Republic of the Congo|0.00|25.00;DK|Denmark|56.00|10.00;DJ|Djibouti|11.50|43.00;DM|Dominica|15.42|-61.33;DO|Dominican Republic|19.00|-70.67;EC|Ecuador|-2.00|-77.50;EG|Egypt|27.00|30.00;SV|El Salvador|13.83|-88.92;GQ|Equatorial Guinea|2.00|10.00;ER|Eritrea|15.00|39.00;EE|Estonia|59.00|26.00;SZ|Eswatini|-26.50|31.50;ET|Ethiopia|8.00|38.00;FK|Falkland Islands (Malvinas)|-51.75|-59.00;FO|Faroe Islands|62.00|-7.00;FJ|Fiji|-18.00|175.00;FI|Finland|64.00|26.00;FR|France|46.00|2.00;GF|French Guiana|4.00|-53.00;PF|French Polynesia|-15.00|-140.00;TF|French Southern Territories|-49.30|69.50;GA|Gabon|-1.00|11.75;GM|Gambia|13.47|-16.57;GE|Georgia|42.00|43.50;DE|Germany|51.00|9.00;GH|Ghana|8.00|-2.00;GI|Gibraltar|36.13|-5.35;GR|Greece|39.00|22.00;GL|Greenland|72.00|-40.00;GD|Grenada|12.12|-61.67;GP|Guadeloupe|16.25|-61.58;GU|Guam|13.47|144.78;GT|Guatemala|15.50|-90.25;GG|Guernsey|49.47|-2.58;GN|Guinea|11.00|-10.00;GW|Guinea-Bissau|12.00|-15.00;GY|Guyana|5.00|-59.00;HT|Haiti|19.00|-72.42;HM|Heard Island and McDonald Islands|-53.10|72.52;HN|Honduras|15.00|-86.50;HK|Hong Kong|22.25|114.17;HU|Hungary|47.00|20.00;IS|Iceland|65.00|-18.00;IN|India|20.00|77.00;ID|Indonesia|-5.00|120.00;IR|Iran|32.00|53.00;IQ|Iraq|33.00|44.00;IE|Ireland|53.00|-8.00;IM|Isle of Man|54.25|-4.50;IL|Israel|31.50|34.75;IT|Italy|42.83|12.83;JM|Jamaica|18.25|-77.50;JP|Japan|36.00|138.00;JE|Jersey|49.25|-2.17;JO|Jordan|31.00|36.00;KZ|Kazakhstan|48.00|68.00;KE|Kenya|1.00|38.00;KI|Kiribati|1.42|173.00;KW|Kuwait|29.50|45.75;KG|Kyrgyzstan|41.00|75.00;LA|Laos|18.00|105.00;LV|Latvia|57.00|25.00;LB|Lebanon|33.83|35.83;LS|Lesotho|-29.50|28.50;LR|Liberia|6.50|-9.50;LY|Libya|25.00|17.00;LI|Liechtenstein|47.27|9.53;LT|Lithuania|56.00|24.00;LU|Luxembourg|49.75|6.17;MO|Macao|22.17|113.55;MG|Madagascar|-20.00|47.00;MW|Malawi|-13.50|34.00;MY|Malaysia|2.50|112.50;MV|Maldives|3.25|73.00;ML|Mali|17.00|-4.00;MT|Malta|35.83|14.58;MH|Marshall Islands|9.00|168.00;MQ|Martinique|14.67|-61.00;MR|Mauritania|20.00|-12.00;MU|Mauritius|-20.28|57.55;YT|Mayotte|-12.83|45.17;MX|Mexico|23.00|-102.00;FM|Micronesia, Federated States of|6.92|158.25;MD|Moldova|47.00|29.00;MC|Monaco|43.73|7.40;MN|Mongolia|46.00|105.00;ME|Montenegro|42.70|19.30;MS|Montserrat|16.75|-62.20;MA|Morocco|32.00|-5.00;MZ|Mozambique|-18.25|35.00;MM|Myanmar|21.00|96.00;NA|Namibia|-22.00|17.00;NR|Nauru|-0.53|166.92;NP|Nepal|28.00|84.00;NL|Netherlands|52.50|5.75;NC|New Caledonia|-21.50|165.50;NZ|New Zealand|-41.00|174.00;NI|Nicaragua|13.00|-85.00;NE|Niger|16.00|8.00;NG|Nigeria|10.00|8.00;NU|Niue|-19.03|-169.87;NF|Norfolk Island|-29.03|167.95;KP|North Korea|40.00|127.00;MK|North Macedonia|41.60|21.70;MP|Northern Mariana Islands|15.20|145.75;NO|Norway|62.00|10.00;OM|Oman|21.00|57.00;PK|Pakistan|30.00|70.00;PW|Palau|7.50|134.50;PS|Palestine|31.93|35.24;PA|Panama|9.00|-80.00;PG|Papua New Guinea|-6.00|147.00;PY|Paraguay|-23.00|-58.00;PE|Peru|-10.00|-76.00;PH|Philippines|13.00|122.00;PN|Pitcairn|-24.36|-128.30;PL|Poland|52.00|20.00;PT|Portugal|39.50|-8.00;PR|Puerto Rico|18.25|-66.50;QA|Qatar|25.50|51.25;RO|Romania|46.00|25.00;RU|Russia|60.00|100.00;RW|Rwanda|-2.00|30.00;RE|Réunion|-21.15|55.50;BL|Saint Barthélemy|17.90|-62.83;SH|Saint Helena, Ascension and Tristan da Cunha|-15.95|-5.70;KN|Saint Kitts and Nevis|17.33|-62.75;LC|Saint Lucia|13.88|-60.97;MF|Saint Martin (French part)|18.08|-63.06;PM|Saint Pierre and Miquelon|46.83|-56.33;VC|Saint Vincent and the Grenadines|13.25|-61.20;WS|Samoa|-13.58|-172.33;SM|San Marino|43.77|12.42;ST|Sao Tome and Principe|0.23|6.61;SA|Saudi Arabia|25.00|45.00;SN|Senegal|14.00|-14.00;RS|Serbia|44.13|16.43;SC|Seychelles|-4.58|55.67;SL|Sierra Leone|8.50|-11.50;SG|Singapore|1.37|103.80;SX|Sint Maarten (Dutch part)|18.04|-63.07;SK|Slovakia|48.67|19.50;SI|Slovenia|46.12|14.82;SB|Solomon Islands|-8.00|159.00;SO|Somalia|10.00|49.00;ZA|South Africa|-29.00|24.00;GS|South Georgia and the South Sandwich Islands|-54.50|-37.00;KR|South Korea|37.00|127.50;SS|South Sudan|7.00|30.00;ES|Spain|40.00|-4.00;LK|Sri Lanka|7.00|81.00;SD|Sudan|15.00|30.00;SR|Suriname|4.00|-56.00;SJ|Svalbard and Jan Mayen|78.00|20.00;SE|Sweden|62.00|15.00;CH|Switzerland|47.00|8.00;SY|Syria|35.00|38.00;TW|Taiwan|23.50|121.00;TJ|Tajikistan|39.00|71.00;TZ|Tanzania|-6.00|35.00;TH|Thailand|15.00|100.00;TL|Timor-Leste|-8.83|125.92;TG|Togo|8.00|1.17;TK|Tokelau|-9.00|-172.00;TO|Tonga|-20.00|-175.00;TT|Trinidad and Tobago|11.00|-61.00;TN|Tunisia|34.00|9.00;TM|Turkmenistan|40.00|60.00;TC|Turks and Caicos Islands|21.80|-71.74;TV|Tuvalu|-8.00|178.00;TR|Türkiye|39.00|35.00;VI|U.S. Virgin Islands|17.74|-64.76;UG|Uganda|1.00|32.00;UA|Ukraine|49.00|32.00;AE|United Arab Emirates|24.00|54.00;GB|United Kingdom|54.00|-2.00;US|United States|38.00|-97.00;UM|United States Minor Outlying Islands|19.30|166.60;UY|Uruguay|-33.00|-56.00;UZ|Uzbekistan|41.00|64.00;VU|Vanuatu|-16.00|167.00;VA|Vatican City|41.90|12.45;VE|Venezuela|8.00|-66.00;VN|Vietnam|16.17|107.83;WF|Wallis and Futuna|-13.30|-176.20;EH|Western Sahara|24.50|-13.00;YE|Yemen|15.00|48.00;ZM|Zambia|-15.00|30.00;ZW|Zimbabwe|-20.00|30.00;AX|Åland Islands|60.20|19.90`;

export const COUNTRY_COVERAGE_METADATA: CountryCoverageMetadata[] = COUNTRY_DATA
  .split(";")
  .map((row) => {
    const [code, name, latitude, longitude] = row.split("|");
    return {
      code,
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  });

export const COUNTRY_COVERAGE_BY_CODE = new Map(
  COUNTRY_COVERAGE_METADATA.map((country) => [country.code, country] as const),
);

export function getCountryCoverageMetadata(code: string | null | undefined): CountryCoverageMetadata | null {
  const normalized = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return COUNTRY_COVERAGE_BY_CODE.get(normalized) ?? null;
}

export function getCountryMapPoint(code: string | null | undefined): CountryMapPoint | null {
  const country = getCountryCoverageMetadata(code);
  if (!country) return null;

  // The homepage image uses a slightly compressed equirectangular projection.
  // These coefficients are calibrated against the original Tiny Steps pin positions.
  const x = 47.2094 + (0.227422 * country.longitude);
  const y = 66.2799 - (0.475123 * country.latitude);

  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(6, Math.min(94, y)),
  };
}
