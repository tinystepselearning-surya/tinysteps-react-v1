import React from "react";
import { COUNTRY_COVERAGE_METADATA } from "../../lib/countryCoverage";

type CountrySelectProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  allowEmpty?: boolean;
};

export default function CountrySelect({
  value,
  onChange,
  disabled = false,
  id,
  className = "",
  allowEmpty = true,
}: CountrySelectProps) {
  return (
    <select
      id={id}
      value={String(value || "").toUpperCase()}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={[
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
    >
      {allowEmpty ? <option value="">Select country</option> : null}
      {COUNTRY_COVERAGE_METADATA.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name} ({country.code})
        </option>
      ))}
    </select>
  );
}
