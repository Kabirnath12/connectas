"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { apiRequest } from "@/lib/api";

type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "FOLLOW"
  | "COLLABORATION"
  | "MESSAGE"
  | "APPLICATION"
  | "SYSTEM";

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      setLoading(true);

      const response = await apiRequest<{
        notifications: Notification[];
      }>("/notifications");

      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(id: string) {
    try {
      await apiRequest(`/notifications/${id}/read`, {
        method: "PATCH",
      });

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  }

  async function markAllRead() {
    try {
      await apiRequest("/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  }

  function icon(type: NotificationType) {
    switch (type) {
      case "LIKE":
        return "❤️";
      case "COMMENT":
        return "💬";
      case "FOLLOW":
        return "👤";
      case "COLLABORATION":
        return "🤝";
      case "MESSAGE":
        return "✉️";
      case "APPLICATION":
        return "💼";
      default:
        return "🔔";
    }
  }

  function timeAgo(date: string) {
    const seconds = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return new Date(date).toLocaleDateString("en-IN");
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] pb-20">
      <TopNav />

      <main className="mx-auto w-full max-w-2xl px-3 py-5 sm:px-5">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Stay updated with what&apos;s happening on CollabX.
              </p>
            </div>

            {notifications.some((item) => !item.read) && (
              <button
                onClick={markAllRead}
                className="text-sm font-semibold text-gray-700 hover:text-black"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">🔔</div>

              <h2 className="mt-4 font-semibold text-gray-900">
                No notifications yet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Likes, comments, follows, messages and collaboration
                requests will appear here.
              </p>

              <Link
                href="/feed"
                className="mt-5 inline-block rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
              >
                Go to Home
              </Link>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => markRead(notification.id)}
                  className={`flex w-full gap-4 border-b border-gray-100 px-5 py-4 text-left transition hover:bg-gray-50 ${
                    !notification.read ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
                    {icon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-6 ${
                        notification.read
                          ? "text-gray-600"
                          : "font-semibold text-gray-900"
                      }`}
                    >
                      {notification.message}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.read && (
                    <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-black" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}