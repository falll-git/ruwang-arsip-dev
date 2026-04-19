"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  dummyDisposisi,
  dummyDokumen,
  dummyPeminjaman,
  type Disposisi,
  type Dokumen,
  type Peminjaman,
} from "@/lib/data";
import { toIsoDate } from "@/lib/utils/date";

type WorkflowStorage = {
  dokumen: Dokumen[];
  disposisi: Disposisi[];
  peminjaman: Peminjaman[];
};

type SubmitDisposisiParams = {
  dokumenIds: number[];
  alasanPengajuan: string;
  pemohon: string;
};

type ProcessDisposisiParams = {
  id: number;
  action: "approve" | "reject";
  alasanAksi: string;
  tanggalExpired?: string;
};

type SubmitPeminjamanParams = {
  dokumenIds: number[];
  tanggalPeminjaman: string;
  tanggalPengembalian: string;
  alasan: string;
  peminjam: string;
};

type CreateDokumenParams = {
  kode: string;
  jenisDokumen: string;
  namaDokumen: string;
  detail: string;
  userInput: string;
  tempatPenyimpanan: string;
  tempatPenyimpananId: string | number;
  isRestrict: boolean;
  fileUrl?: string;
};

type ProcessPeminjamanParams = {
  id: number;
  action: "approve" | "reject";
  tanggalPenyerahan?: string;
  alasanAksi: string;
  approver?: string;
};

type ArsipDigitalWorkflowValue = {
  dokumen: Dokumen[];
  disposisi: Disposisi[];
  peminjaman: Peminjaman[];
  createDokumen: (params: CreateDokumenParams) => Dokumen;
  submitDisposisi: (params: SubmitDisposisiParams) => number;
  processDisposisi: (params: ProcessDisposisiParams) => boolean;
  submitPeminjaman: (params: SubmitPeminjamanParams) => number;
  processPeminjaman: (params: ProcessPeminjamanParams) => boolean;
  resetWorkflowData: () => void;
};

interface ArsipDigitalWorkflowProviderProps {
  children: ReactNode;
}

const ArsipDigitalWorkflowContext =
  createContext<ArsipDigitalWorkflowValue | null>(null);

function cloneDokumen(value: Dokumen[]): Dokumen[] {
  return value.map((item) => ({ ...item }));
}

function cloneDisposisi(value: Disposisi[]): Disposisi[] {
  return value.map((item) => ({ ...item }));
}

function clonePeminjaman(value: Peminjaman[]): Peminjaman[] {
  return value.map((item) => ({ ...item }));
}

function currentTimeHHmm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function syncDokumenStatusWithPeminjaman(
  dokumen: Dokumen[],
  peminjaman: Peminjaman[],
): Dokumen[] {
  const activeLoanStatusByDoc = new Map<number, "Dipinjam" | "Diajukan">();

  peminjaman.forEach((item) => {
    if (item.status === "Dipinjam") {
      activeLoanStatusByDoc.set(item.dokumenId, "Dipinjam");
      return;
    }

    if (item.status === "Pending" && !activeLoanStatusByDoc.has(item.dokumenId)) {
      activeLoanStatusByDoc.set(item.dokumenId, "Diajukan");
    }
  });

  return dokumen.map((item) => {
    const activeStatus = activeLoanStatusByDoc.get(item.id);
    const statusPinjam: Dokumen["statusPinjam"] = activeStatus ?? "Tersedia";
    const statusPeminjaman: Dokumen["statusPeminjaman"] = statusPinjam;
    return {
      ...item,
      statusPinjam,
      statusPeminjaman,
    };
  });
}

function buildDefaultState(): WorkflowStorage {
  const basePeminjaman = clonePeminjaman(dummyPeminjaman);
  const baseDokumen = syncDokumenStatusWithPeminjaman(cloneDokumen(dummyDokumen), basePeminjaman);
  return {
    dokumen: baseDokumen,
    disposisi: cloneDisposisi(dummyDisposisi),
    peminjaman: basePeminjaman,
  };
}

export function ArsipDigitalWorkflowProvider({
  children,
}: ArsipDigitalWorkflowProviderProps): ReactNode {
  const [dokumen, setDokumen] = useState<Dokumen[]>(() => buildDefaultState().dokumen);
  const [disposisi, setDisposisi] = useState<Disposisi[]>(
    () => buildDefaultState().disposisi,
  );
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>(
    () => buildDefaultState().peminjaman,
  );

  const createDokumen = useCallback(
    ({
      kode,
      jenisDokumen,
      namaDokumen,
      detail,
      userInput,
      tempatPenyimpanan,
      tempatPenyimpananId,
      isRestrict,
      fileUrl,
    }: CreateDokumenParams) => {
      const nextId = dokumen.reduce((max, item) => Math.max(max, item.id), 0) + 1;

      const newDokumen: Dokumen = {
        id: nextId,
        kode: kode.trim(),
        jenisDokumen: jenisDokumen.trim(),
        namaDokumen: namaDokumen.trim(),
        detail: detail.trim(),
        tglInput: toIsoDate(new Date()),
        userInput: userInput.trim() || "SYSTEM",
        tempatPenyimpanan,
        tempatPenyimpananId,
        statusPinjam: "Tersedia",
        statusPeminjaman: "Tersedia",
        levelAkses: isRestrict ? "RESTRICT" : "NON_RESTRICT",
        restrict: isRestrict,
        fileUrl: fileUrl ?? "/documents/contoh-dok.pdf",
      };

      setDokumen((prev) => [...prev, newDokumen]);
      return newDokumen;
    },
    [dokumen],
  );

  const submitDisposisi = useCallback(
    ({ dokumenIds, alasanPengajuan, pemohon }: SubmitDisposisiParams) => {
      const uniqueIds = Array.from(new Set(dokumenIds));
      const documents = uniqueIds
        .map((id) => dokumen.find((item) => item.id === id))
        .filter((item): item is Dokumen => item !== undefined);

      if (documents.length === 0) return 0;

      let nextId = disposisi.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const today = toIsoDate(new Date());

      const newDisposisi = documents.map((item) => ({
        id: nextId++,
        dokumenId: item.id,
        detail: item.detail,
        pemohon: pemohon.trim() || "SYSTEM",
        pemilik: item.userInput,
        tglPengajuan: today,
        status: "Pending" as const,
        alasanPengajuan: alasanPengajuan.trim(),
        tglExpired: null,
        tglAksi: null,
        alasanAksi: null,
      }));

      setDisposisi((prev) => [...prev, ...newDisposisi]);
      return newDisposisi.length;
    },
    [disposisi, dokumen],
  );

  const processDisposisi = useCallback(
    ({ id, action, alasanAksi, tanggalExpired }: ProcessDisposisiParams) => {
      const target = disposisi.find((item) => item.id === id);
      if (!target || target.status !== "Pending") return false;

      const today = toIsoDate(new Date());
      const nextStatus = action === "approve" ? "Approved" : "Rejected";

      setDisposisi((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: nextStatus,
                tglExpired: action === "approve" ? (tanggalExpired ?? null) : null,
                tglAksi: today,
                alasanAksi: alasanAksi.trim() || null,
              }
            : item,
        ),
      );

      return true;
    },
    [disposisi],
  );

  const submitPeminjaman = useCallback(
    ({
      dokumenIds,
      tanggalPeminjaman,
      tanggalPengembalian,
      alasan,
      peminjam,
    }: SubmitPeminjamanParams) => {
      const uniqueIds = Array.from(new Set(dokumenIds));
      const availableDocs = uniqueIds
        .map((id) => dokumen.find((item) => item.id === id))
        .filter((item): item is Dokumen => item !== undefined)
        .filter((item) => item.statusPinjam === "Tersedia");

      if (availableDocs.length === 0) return 0;

      let nextId = peminjaman.reduce((max, item) => Math.max(max, item.id), 0) + 1;

      const newPeminjaman = availableDocs.map((item) => ({
        id: nextId++,
        dokumenId: item.id,
        detail: item.namaDokumen,
        peminjam: peminjam.trim() || "SYSTEM",
        tglPinjam: tanggalPeminjaman,
        tglKembali: tanggalPengembalian,
        tglPengembalian: null,
        status: "Pending" as const,
        alasan: alasan.trim(),
        approver: null,
        tglApprove: null,
        jamApprove: null,
        alasanApprove: null,
        tglPenyerahan: null,
      }));

      const nextPeminjaman = [...peminjaman, ...newPeminjaman];
      setPeminjaman(nextPeminjaman);
      setDokumen(syncDokumenStatusWithPeminjaman(dokumen, nextPeminjaman));

      return newPeminjaman.length;
    },
    [dokumen, peminjaman],
  );

  const processPeminjaman = useCallback(
    ({
      id,
      action,
      tanggalPenyerahan,
      alasanAksi,
      approver,
    }: ProcessPeminjamanParams) => {
      const target = peminjaman.find((item) => item.id === id);
      if (!target) return false;

      const today = toIsoDate(new Date());
      const nowTime = currentTimeHHmm();

      const nextPeminjaman = peminjaman.map((item) => {
        if (item.id !== id) return item;

        if (item.status === "Pending") {
          if (action === "approve") {
            return {
              ...item,
              status: "Dipinjam" as const,
              approver: approver ?? item.approver,
              tglApprove: today,
              jamApprove: nowTime,
              alasanApprove: alasanAksi.trim() || item.alasanApprove,
              tglPenyerahan: tanggalPenyerahan ?? today,
            };
          }

          return {
            ...item,
            status: "Ditolak" as const,
            approver: approver ?? item.approver,
            tglApprove: today,
            jamApprove: nowTime,
            alasanApprove: alasanAksi.trim() || item.alasanApprove,
            tglPenyerahan: null,
          };
        }

        if (item.status === "Dipinjam") {
          if (action === "approve") {
            return {
              ...item,
              status: "Dikembalikan" as const,
              tglPengembalian: tanggalPenyerahan ?? today,
              approver: approver ?? item.approver,
              tglApprove: item.tglApprove ?? today,
              jamApprove: item.jamApprove ?? nowTime,
              alasanApprove: alasanAksi.trim() || item.alasanApprove,
            };
          }

          return {
            ...item,
            approver: approver ?? item.approver,
            tglApprove: today,
            jamApprove: nowTime,
            alasanApprove: alasanAksi.trim() || item.alasanApprove,
          };
        }

        return item;
      });

      setPeminjaman(nextPeminjaman);
      setDokumen(syncDokumenStatusWithPeminjaman(dokumen, nextPeminjaman));

      return true;
    },
    [dokumen, peminjaman],
  );

  const resetWorkflowData = useCallback(() => {
    const next = buildDefaultState();
    setDokumen(next.dokumen);
    setDisposisi(next.disposisi);
    setPeminjaman(next.peminjaman);
  }, []);

  const value = useMemo<ArsipDigitalWorkflowValue>(
    () => ({
      dokumen,
      disposisi,
      peminjaman,
      createDokumen,
      submitDisposisi,
      processDisposisi,
      submitPeminjaman,
      processPeminjaman,
      resetWorkflowData,
    }),
    [
      createDokumen,
      disposisi,
      dokumen,
      peminjaman,
      processDisposisi,
      processPeminjaman,
      resetWorkflowData,
      submitDisposisi,
      submitPeminjaman,
    ],
  );

  return (
    <ArsipDigitalWorkflowContext.Provider value={value}>
      {children}
    </ArsipDigitalWorkflowContext.Provider>
  );
}

export function useArsipDigitalWorkflow(): ArsipDigitalWorkflowValue {
  const context = useContext(ArsipDigitalWorkflowContext);
  if (!context) {
    throw new Error(
      "useArsipDigitalWorkflow must be used within ArsipDigitalWorkflowProvider",
    );
  }
  return context;
}
