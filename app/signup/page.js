"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { name, email, password, confirmPassword } = formData;

    if (!name || !name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!email || !email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        // Redirect to CRM dashboard
        router.push("/");
        router.refresh();
      } else {
        setErrorMsg(result.message || "Failed to create account.");
      }
    } catch (err) {
      setErrorMsg("Network connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0b0f17] text-[#f9fafb] selection:bg-[var(--primary)] selection:text-[#0b0f17]">
      {/* Background glow effects */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--border)] relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="p-3 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--fg)] tracking-tight">
            Lead Management CRM
          </h1>
          <p className="text-xs text-[var(--fg-subtle)] font-medium">
            Create your account to access your workspace
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[var(--red)] text-xs font-semibold animate-in fade-in duration-150 flex items-center justify-between">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Rajveer Singh"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] transition-all min-h-[44px]"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="rajveer@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] transition-all min-h-[44px]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
              Password
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
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Re-enter password"
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
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-4 border-t border-[var(--border)]/60 text-center text-xs text-[var(--fg-subtle)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[var(--primary)] hover:underline ml-1"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
