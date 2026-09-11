"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(""); setError("");
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setMessage("Account created successfully. You can now log in.");
      setName(""); setEmail(""); setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <a href="/" className="text-sm font-semibold">← CollabX</a>
        <h1 className="mt-6 text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-gray-600">Join CollabX.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required className="w-full rounded-xl border px-4 py-3" />
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-xl border px-4 py-3" />
          <input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" required className="w-full rounded-xl border px-4 py-3" />
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {message && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-600">{message}</div>}
          <button className="w-full rounded-xl bg-black py-3 font-medium text-white">Create account</button>
        </form>
        <p className="mt-5 text-sm text-gray-600">Already have an account? <a href="/login" className="font-semibold text-black">Login</a></p>
      </div>
    </main>
  );
}
