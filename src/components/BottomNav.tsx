"use client";

import Link from "next/link";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        <Link
          href="/feed"
          className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700"
        >
          <span className="text-lg">⌂</span>
          Home
        </Link>

        <Link
          href="/search"
          className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700"
        >
          <span className="text-lg">⌕</span>
          Search
        </Link>

        <Link
          href="/feed"
          className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700"
        >
          <span className="text-xl">＋</span>
          Create
        </Link>

        <Link
          href="/collaborations"
          className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700"
        >
          <span className="text-lg">🤝</span>
          Collabs
        </Link>

        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700"
        >
          <span className="text-lg">◯</span>
          Profile
        </Link>
      </div>
    </nav>
  );
}