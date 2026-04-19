"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Mail, Send } from "lucide-react";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setValidationMessage("");
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setValidationMessage("Email wajib diisi.");
      return;
    }

    setIsLoading(true);
    setIsLoading(false);
    setSubmittedEmail(trimmedEmail);
    setIsSuccess(true);
  };

  return (
    <AuthSplitLayout>
      <div className="auth-card animate-auth-in rounded-[28px] px-7 py-8 sm:px-8 sm:py-9">
        <div className="relative z-10">
          {!isSuccess ? (
            <>
              <header className="mb-6 text-center">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#157ec3]">
                  RUWANG ARSIP
                </h1>
                <h2 className="mt-3 text-xl font-semibold text-slate-800">
                  Lupa Password?
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Masukkan email Anda dan kami akan mengirimkan link reset
                  password.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#157ec3]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email Anda"
                      className="input-fancy"
                    />
                  </div>
                </div>

                {validationMessage ? (
                  <p className="text-sm font-medium text-red-600">
                    {validationMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-effect-button"
                >
                  <span className="auth-effect-button__top">
                    {isLoading ? (
                      <>
                        <span className="button-spinner" aria-hidden="true" />
                        <span>MEMPROSES...</span>
                      </>
                    ) : (
                      <>
                        <span>KIRIM LINK RESET</span>
                        <Send className="h-5 w-5" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#157ec3] transition-colors hover:text-[#0d5a8f]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Halaman Login
                </Link>
              </div>
            </>
          ) : (
            <div className="py-3 text-center">
              <div
                className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #34d399 0%, #10b981 45%, #059669 100%)",
                  boxShadow: "0 12px 28px rgba(16, 185, 129, 0.32)",
                }}
              >
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-800">
                Cek Email Anda
              </h2>
              <p className="text-sm text-slate-600">
                Link reset password telah dikirim ke email:
              </p>
              <p className="mb-5 mt-1 text-sm font-semibold text-[#157ec3]">
                {submittedEmail}
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setValidationMessage("");
                  }}
                >
                  <span className="button-outer">
                    <span className="button-inner">KIRIM ULANG EMAIL</span>
                  </span>
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#157ec3] transition-colors hover:text-[#0d5a8f]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthSplitLayout>
  );
}
