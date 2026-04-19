"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { formatCurrency } from "@/lib/data";

export type DebiturSearchOption = {
  id: string;
  namaNasabah: string;
  kolektibilitas: string;
  osPokok: number;
};

type SearchableDebiturSelectProps = {
  value: string;
  onChange: (nextValue: string) => void;
  options: DebiturSearchOption[];
  placeholder?: string;
};

export default function SearchableDebiturSelect({
  value,
  onChange,
  options,
  placeholder = "Cari nama nasabah atau ID debitur...",
}: SearchableDebiturSelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const inputValue =
    value && !isOpen && !searchText
      ? (selectedOption?.namaNasabah ?? "")
      : searchText;

  const filteredOptions = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => {
      const byId = option.id.toLowerCase().includes(keyword);
      const byName = option.namaNasabah.toLowerCase().includes(keyword);
      return byId || byName;
    });
  }, [options, searchText]);

  return (
    <div ref={wrapperRef} className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        aria-hidden="true"
      />
      <input
        type="text"
        value={inputValue}
        onChange={(event) => {
          setSearchText(event.target.value);
          if (value) onChange("");
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          if (!searchText && selectedOption) {
            setSearchText(selectedOption.namaNasabah);
          }
        }}
        className="input input-with-icon pr-10"
        placeholder={placeholder}
        autoComplete="off"
      />

      {(searchText || value) && (
        <button
          type="button"
          onClick={() => {
            setSearchText("");
            onChange("");
            setIsOpen(true);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
          title="Hapus pilihan"
        >
          <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {filteredOptions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">
              Debitur tidak ditemukan.
            </p>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setSearchText(option.namaNasabah);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left border-b border-gray-100 last:border-0 hover:bg-blue-50/50 transition-colors"
              >
                <p className="font-medium text-gray-900">
                  {option.namaNasabah}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {option.id} - Kol {option.kolektibilitas} (
                  {formatCurrency(option.osPokok)})
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
