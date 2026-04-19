import type { ReactNode } from "react";

type AuthSplitLayoutProps = {
  children: ReactNode;
};

export default function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex items-center justify-center bg-white px-12 py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-100 to-slate-200/70 p-6 shadow-xl">
            <div className="flex aspect-4/3 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/70">
              <span className="text-xs font-semibold tracking-[0.3em] text-slate-500">
                ILUSTRASI
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-[#157ec3]">Welcome</h2>
            <p className="text-base leading-relaxed text-slate-600">
              Kelola arsip Anda dengan mudah dan aman menggunakan RUWANG ARSIP
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#157ec3] p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
