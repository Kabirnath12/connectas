"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email?: string;
  profile?: {
    username?: string;
    avatarUrl?: string | null;
  } | null;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;

  participants: User[];

  lastMessage?: Message | null;
};

type ConversationsResponse = {
  success: boolean;
  conversations: Conversation[];
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await apiRequest<ConversationsResponse>(
          "/messages/conversations"
        );

      setConversations(data.conversations || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load messages"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const getOtherUser = (
    conversation: Conversation
  ) => {
    return conversation.participants?.[0] || null;
  };

  const getLastMessage = (
    conversation: Conversation
  ) => {
    return (
      conversation.lastMessage?.text ||
      "No messages yet"
    );
  };

  const getLastMessageTime = (
    conversation: Conversation
  ) => {
    return (
      conversation.lastMessage?.createdAt ||
      conversation.updatedAt
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    const today = new Date();

    const sameDay =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (sameDay) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-3xl bg-white shadow-sm">

        {/* Header */}
        {/* Header */}
<header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
  <div className="flex items-center gap-3">

    <Link
      href="/"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      aria-label="Back to home"
    >
      <span className="text-lg">&larr;</span>
      <span>Home</span>
    </Link>

    <div>
      <h1 className="text-xl font-bold text-gray-900">
        Messages
      </h1>

      <p className="text-sm text-gray-500">
        Your conversations
      </p>
    </div>

  </div>

  <button
    onClick={loadConversations}
    disabled={loading}
    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
  >
    Refresh
  </button>
</header>

        {/* Error */}
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
              💬
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              No conversations yet
            </h2>

            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Start a collaboration with someone on
              CollabX and your conversation will appear
              here.
            </p>

            <Link
              href="/search"
              className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Discover People
            </Link>

          </div>
        ) : (
          <div className="divide-y divide-gray-100">

            {conversations.map((conversation) => {
              const user =
                getOtherUser(conversation);

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50"
                >

                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-600">

                    {user?.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.name
                        ?.split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "U"
                    )}

                  </div>

                  {/* Conversation */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-3">

                      <h2 className="truncate font-semibold text-gray-900">
                        {user?.name ||
                          "Conversation"}
                      </h2>

                      <span className="shrink-0 text-xs text-gray-400">
                        {formatTime(
                          getLastMessageTime(
                            conversation
                          )
                        )}
                      </span>

                    </div>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      {getLastMessage(
                        conversation
                      )}
                    </p>

                  </div>

                  <div className="text-gray-400">
                    →
                  </div>

                </Link>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}