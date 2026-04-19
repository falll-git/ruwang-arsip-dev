import type { IdebRecord } from "@/lib/types";

export function getStoredIdebUploads(): IdebRecord[] {
  return [];
}

export function getStoredDeletedIdebIds(): string[] {
  return [];
}

export function saveStoredIdebUploads(_records: IdebRecord[]) {
  void _records;
}

export function saveStoredDeletedIdebIds(_ids: string[]) {
  void _ids;
}

export function getMergedIdebRecords(): IdebRecord[] {
  return [];
}

export function persistIdebRecord(_record: IdebRecord) {
  void _record;
}

export function removeIdebRecord(_recordId: string) {
  void _recordId;
}
