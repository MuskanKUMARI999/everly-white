import { ChevronDown } from "lucide-react";
import { COUNTRY_CODES } from "./countryCodes";

interface PhoneInputProps {
  countryIso: string;
  onCountryIsoChange: (iso: string) => void;
  number: string;
  onNumberChange: (number: string) => void;
  inputClassName: string;
  required?: boolean;
}

export function PhoneInput({
  countryIso,
  onCountryIsoChange,
  number,
  onNumberChange,
  inputClassName,
  required = true,
}: PhoneInputProps) {
  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <select
          aria-label="Country"
          value={countryIso}
          onChange={(e) => onCountryIsoChange(e.target.value)}
          className={`${inputClassName} w-[5.75rem] cursor-pointer appearance-none pr-6`}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-300"
        />
      </div>
      <div className="relative flex-1">
        <input
          required={required}
          type="tel"
          value={number}
          onChange={(e) => onNumberChange(e.target.value.replace(/[^\d ]/g, ""))}
          placeholder="Phone Number"
          aria-label="Phone Number"
          autoComplete="tel-national"
          className={`${inputClassName} w-full`}
        />
        {required && (
          <span className="pointer-events-none absolute right-3 top-2 font-body text-xs text-terracotta">
            *
          </span>
        )}
      </div>
    </div>
  );
}
