"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CollabXLogo from "./CollabXLogo";
import { apiRequest } from "@/lib/api";

export default function TopNav() {
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  async function loadCounts() {
    try {
      // Notifications
      const notificationResponse = await apiRequest<{
        unreadCount: number;
      }>("/notifications");

      setUnreadNotificationCount(
        notificationResponse.unreadCount || 0
      );
    } catch {
      // User may not be authenticated yet.
    }

    try {
      // Messages
      const messageResponse = await apiRequest<{
        unreadCount: number;
      }>("/messages/unread-count");

      setUnreadMessageCount(
        messageResponse.unreadCount || 0
      );
    } catch {
      // User may not be authenticated yet.
    }
  }

  useEffect(() => {
    loadCounts();

    const interval = setInterval(loadCounts, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/feed" className="shrink-0">
          <CollabXLogo />
        </Link>

        <div className="hidden flex-1 md:block">
          <div className="mx-auto max-w-md">
            <input
              type="search"
              placeholder="Search people, creators, jobs, services..."
              className="w-full rounded-full bg-gray-100 px-5 py-2.5 text-sm outline-none transition focus:bg-gray-50 focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/feed"
            className="rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Home
          </Link>

          <Link
            href="/search"
            className="rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Search
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-gray-100"
            aria-label="Notifications"
          >
            🔔

            {unreadNotificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadNotificationCount > 99
                  ? "99+"
                  : unreadNotificationCount}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-gray-100"
            aria-label="Messages"
          >
            💬

            {unreadMessageCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadMessageCount > 99
                  ? "99+"
                  : unreadMessageCount}
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            className="rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}