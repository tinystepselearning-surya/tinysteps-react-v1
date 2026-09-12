import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import {
  findPhoneCountryOptionByCallingCode,
  findPhoneCountryOptionById,
  searchPhoneCountryOptions,
} from '../../../lib/phoneCountryOptions';

export interface PhoneEditorValue {
  key: string;
  userDocId: string;
  countryOptionId: string;
  countryCode: string;
  phone: string;
}

interface PhoneNumberEditorDialogProps {
  open: boolean;
  value: PhoneEditorValue | null;
  title?: string;
  description?: string;
  saving?: boolean;
  onChange: (next: PhoneEditorValue) => void;
  onClose: () => void;
  onSave: () => void;
}

const digitsOnly = (value: string): string => String(value || '').replace(/\D/g, '');

export default function PhoneNumberEditorDialog({
  open,
  value,
  title = 'Edit phone number',
  description,
  saving = false,
  onChange,
  onClose,
  onSave,
}: PhoneNumberEditorDialogProps) {
  const selectedCountry = useMemo(() => {
    if (!value) return undefined;
    return (
      findPhoneCountryOptionById(value.countryOptionId) ||
      findPhoneCountryOptionByCallingCode(value.countryCode)
    );
  }, [value]);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    if (!open || !value) return;
    setCountrySearch(selectedCountry?.label || value.countryCode || '');
  }, [open, selectedCountry?.label, value?.countryCode, value?.userDocId]);

  const searchResults = useMemo(
    () => searchPhoneCountryOptions(countrySearch).slice(0, 80),
    [countrySearch],
  );

  const phoneDigits = digitsOnly(value?.phone || '');
  const e164Preview = value?.countryCode && phoneDigits
    ? `${value.countryCode}${phoneDigits}`
    : '';
  const e164DigitCount = digitsOnly(e164Preview).length;
  const hasValidLength = e164DigitCount >= 8 && e164DigitCount <= 15;
  const canSave = Boolean(value?.countryCode && phoneDigits && hasValidLength && !saving);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl border-slate-200">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone-country-search">
              Country / calling code
            </label>
            <Input
              id="phone-country-search"
              value={countrySearch}
              onChange={(event) => setCountrySearch(event.target.value)}
              placeholder="Search India, USA, United States, +48 or 48"
              autoComplete="off"
              autoFocus
            />
            <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-1">
              {searchResults.length > 0 ? (
                searchResults.map((option) => {
                  const selected = option.id === value?.countryOptionId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors ${
                        selected ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        if (!value) return;
                        onChange({
                          ...value,
                          countryOptionId: option.id,
                          countryCode: option.code,
                        });
                        setCountrySearch(option.label);
                      }}
                    >
                      <span>{option.name}</span>
                      <span className="ml-4 tabular-nums text-muted-foreground">{option.code}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-5 text-center text-sm text-muted-foreground">
                  No country found. Search by country name, ISO code or calling code.
                </div>
              )}
            </div>
            {selectedCountry ? (
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{selectedCountry.label}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone-local-number">
              Phone number
            </label>
            <div className="flex items-stretch gap-2">
              <div className="flex min-w-[84px] items-center justify-center rounded-md border bg-slate-50 px-3 text-sm font-medium tabular-nums">
                {value?.countryCode || 'Code'}
              </div>
              <Input
                id="phone-local-number"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={15}
                value={phoneDigits}
                onChange={(event) => {
                  if (!value) return;
                  onChange({ ...value, phone: digitsOnly(event.target.value) });
                }}
                placeholder="Phone number without country code"
                className="min-w-0 flex-1 text-base tabular-nums"
                autoComplete="tel-national"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digits only. Do not type +, spaces, brackets, hyphens or the country code in this field.
            </p>
            {e164Preview ? (
              <p className={`text-xs ${hasValidLength ? 'text-muted-foreground' : 'text-destructive'}`}>
                WhatsApp number to save: <span className="font-medium tabular-nums">{e164Preview}</span>
                {!hasValidLength ? ' — check the number length.' : ''}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={onSave} disabled={!canSave}>
              {saving ? 'Saving…' : 'Save phone'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
