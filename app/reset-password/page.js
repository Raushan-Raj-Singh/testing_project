"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Invalid or missing password reset link.");
      setIsExpired(true);
      return;
    }

    const { password, confirmPassword } = formData;

    if (!password) {
      setErrorMsg("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (!confirmPassword) {
      setErrorMsg("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const result = await res.json();
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2500);
      } else {
        setErrorMsg(result.message || "Failed to reset password.");
        if (
          result.message &&
          (result.message.toLowerCase().includes("expired") ||
            result.message.toLowerCase().includes("invalid"))
        ) {
          setIsExpired(true);
        }
      }
    } catch (err) {
      setErrorMsg("Network connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-3 rounded-2xl bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[var(--red)] shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
          Invalid Reset Link
        </h1>
        <p className="text-xs text-white font-medium max-w-xs leading-relaxed">
          The password reset link is invalid or missing required parameters.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 w-full py-3 px-4 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg min-h-[44px]"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-3 rounded-2xl bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[var(--green)] shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
          Password Reset Successful
        </h1>
        <p className="text-xs text-white font-medium max-w-xs leading-relaxed">
          Your password has been updated successfully. Redirecting to login...
        </p>
        <Link
          href="/login"
          className="mt-2 w-full py-3 px-4 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg min-h-[44px]"
        >
          Login Now
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header Branding */}
      <div className="flex flex-col items-center text-center gap-2 mb-6">
        <div className="p-3 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
          Reset Password
        </h1>
        <p className="text-xs text-white font-medium max-w-xs leading-relaxed">
          Create a new secure password for your account.
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[var(--red)] text-xs font-semibold animate-in fade-in duration-150 flex flex-col gap-2">
          <span>{errorMsg}</span>
          {isExpired && (
            <Link
              href="/forgot-password"
              className="mt-1 w-full py-2 px-3 text-[11px] font-bold rounded-lg bg-[var(--red)] text-white hover:opacity-90 text-center transition-all shadow-xs"
            >
              Request New Reset Link
            </Link>
          )}
        </div>
      )}

      {/* Reset Password Form */}
      {!isExpired && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] transition-all min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] p-1 rounded focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] transition-all min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] p-1 rounded focus:outline-hidden"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 min-h-[44px] cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating password...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0b0f17] text-[#f9fafb] selection:bg-[var(--primary)] selection:text-[#0b0f17]">
      {/* Background ambient glow effect */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--border)] relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-8 gap-3 text-xs font-semibold text-[var(--fg-muted)]">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
              Loading password reset form...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
