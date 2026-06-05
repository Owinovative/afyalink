"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // Simulated login handler for visual feedback
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Real auth logic will go here later
    setTimeout(() => setIsLoading(false), 2000); 
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", color: "var(--ink-strong)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          Welcome back
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "1rem" }}>
          Sign in to your secure workspace.
        </p>
      </div>

      {/* The Form */}
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Email Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-strong)" }}>
            Email Address
          </label>
          <input 
            id="email"
            type="email" 
            required
            placeholder="name@example.com"
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            style={{ 
              padding: "14px 16px", 
              borderRadius: "var(--radius-md)", 
              border: `2px solid ${emailFocused ? "var(--teal)" : "var(--line-strong)"}`,
              background: "#fff",
              outline: "none",
              fontSize: "1rem",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              boxShadow: emailFocused ? "0 0 0 4px rgba(3, 152, 158, 0.1)" : "none"
            }} 
          />
        </div>

        {/* Password Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-strong)" }}>
              Password
            </label>
            <Link href="/auth/forgot-password" style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>
          <input 
            id="password"
            type="password" 
            required
            placeholder="••••••••"
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
            style={{ 
              padding: "14px 16px", 
              borderRadius: "var(--radius-md)", 
              border: `2px solid ${passFocused ? "var(--teal)" : "var(--line-strong)"}`,
              background: "#fff",
              outline: "none",
              fontSize: "1rem",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              boxShadow: passFocused ? "0 0 0 4px rgba(3, 152, 158, 0.1)" : "none"
            }} 
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            marginTop: "12px",
            padding: "14px", 
            borderRadius: "var(--radius-md)", 
            background: isLoading ? "var(--ink-soft)" : "linear-gradient(135deg, var(--teal), var(--deep))",
            color: "#fff", 
            fontSize: "1.05rem", 
            fontWeight: 600,
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: isLoading ? "none" : "0 4px 15px rgba(3, 152, 158, 0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {isLoading ? (
            <>
              <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
        <p style={{ fontSize: "0.95rem", color: "var(--ink-soft)" }}>
          Don't have an account yet? <Link href="/auth/register" style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>Create one here</Link>
        </p>
      </div>

    </div>
  );
}
