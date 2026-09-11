"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
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
};

type MessagesResponse = {
  success: boolean;
  messages: Message[];
};

type ConversationsResponse = {
  success: boolean;
  conversations: Conversation[];
};

type MeResponse = {
  success: boolean;
  user: User;
};

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();

  const conversationId =
    typeof params.conversationId === "string"
      ? params.conversationId
      : "";

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * Load logged-in user.
   */
  const loadCurrentUser = async () => {
    try {
      const data =
        await apiRequest<MeResponse>("/auth/me");

      setCurrentUser(data.user);
    } catch (err) {
      console.error(
        "Failed to load current user",
        err
      );
    }
  };

  /*
   * Load conversation and messages.
   *
   * The backend marks the conversation as read
   * when messages are fetched.
   */
  const loadConversation = async (
    showLoading = false
  ) => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [
        messagesData,
        conversationsData,
      ] = await Promise.all([
        apiRequest<MessagesResponse>(
          `/messages/conversations/${conversationId}/messages`
        ),

        apiRequest<ConversationsResponse>(
          "/messages/conversations"
        ),
      ]);

      setMessages(
        messagesData.messages || []
      );

      const currentConversation =
        conversationsData.conversations?.find(
          (item) =>
            item.id === conversationId
        );

      setConversation(
        currentConversation || null
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load conversation"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   * Initial load.
   */
  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(true);
    }
  }, [conversationId]);

  /*
   * Auto-scroll to newest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
   * Poll for new messages.
   *
   * This gives us a simple real-time foundation
   * before WebSockets are added.
   */
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const interval = setInterval(() => {
      loadConversation(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [conversationId]);

  /*
   * Other participant.
   */
  const otherUser =
    conversation?.participants?.find(
      (user) =>
        user.id !== currentUser?.id
    ) ||
    conversation?.participants?.[0] ||
    null;

  /*
   * Send message.
   */
  const sendMessage = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    const trimmed = text.trim();

    if (
      !trimmed ||
      !conversationId ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const data =
        await apiRequest<{
          success: boolean;
          message: Message;
        }>(
          `/messages/conversations/${conversationId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({
              text: trimmed,
            }),
          }
        );

      setMessages((current) => [
        ...current,
        data.message,
      ]);

      setText("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  /*
   * Format message time.
   */
  const formatTime = (
    dateString: string
  ) => {
    return new Date(
      dateString
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /*
   * Format full message date for tooltip.
   */
  const formatFullTime = (
    dateString: string
  ) => {
    return new Date(
      dateString
    ).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading conversation...
          </div>
        </div>
      </main>
    );
  }

  /*
   * Conversation does not exist.
   */
  if (!conversation) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center bg-white px-6">
          <div className="text-center">
            <div className="text-5xl">
              💬
            </div>

            <h1 className="mt-4 text-xl font-bold text-gray-900">
              Conversation not found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              This conversation may no longer exist.
            </p>

            <button
              onClick={() =>
                router.push("/messages")
              }
              className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              ← Messages
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-white shadow-sm">

        {/* =========================
            HEADER
        ========================== */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">

          <button
            onClick={() =>
              router.push("/messages")
            }
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            aria-label="Back to messages"
          >
            <span className="text-lg">
              &larr;
            </span>

            <span>Messages</span>
          </button>

          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-600">

            {otherUser?.profile?.avatarUrl ? (
              <img
                src={
                  otherUser.profile.avatarUrl
                }
                alt={otherUser.name}
                className="h-full w-full object-cover"
              />
            ) : (
              otherUser?.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U"
            )}

          </div>

          {/* User information */}
          <div className="min-w-0 flex-1">

            <h1 className="truncate font-semibold text-gray-900">
              {otherUser?.name ||
                "Conversation"}
            </h1>

            {otherUser?.profile?.username && (
              <p className="truncate text-xs text-gray-500">
                @{otherUser.profile.username}
              </p>
            )}

          </div>

          {/* Refresh */}
          <button
            onClick={() =>
              loadConversation(false)
            }
            disabled={refreshing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
            aria-label="Refresh conversation"
            title="Refresh conversation"
          >
            {refreshing ? "…" : "↻"}
          </button>

        </header>

        {/* =========================
            ERROR
        ========================== */}
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>

              <button
                onClick={() =>
                  loadConversation(false)
                }
                className="shrink-0 font-semibold underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* =========================
            MESSAGES
        ========================== */}
        <section
          className="flex-1 overflow-y-auto bg-gray-50 px-4 py-5"
        >

          {messages.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                  💬
                </div>

                <p className="mt-4 font-medium text-gray-700">
                  No messages yet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Start the conversation with{" "}
                  {otherUser?.name || "this user"}.
                </p>

              </div>
            </div>
          ) : (
            <div className="space-y-3">

              {messages.map((message) => {

                const isMine =
                  currentUser?.id ===
                  message.senderId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      title={formatFullTime(
                        message.createdAt
                      )}
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMine
                          ? "rounded-br-md bg-black text-white"
                          : "rounded-bl-md bg-white text-gray-900"
                      }`}
                    >

                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.text}
                      </p>

                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isMine
                            ? "text-gray-300"
                            : "text-gray-400"
                        }`}
                      >
                        <span>
                          {formatTime(
                            message.createdAt
                          )}
                        </span>

                        {isMine && (
                          <span aria-label="Sent">
                            ✓
                          </span>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />

            </div>
          )}

        </section>

        {/* =========================
            COMPOSER
        ========================== */}
        <form
          onSubmit={sendMessage}
          className="border-t border-gray-200 bg-white px-3 py-3"
        >

          <div className="flex items-end gap-2">

            <textarea
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              onKeyDown={(event) => {

                /*
                 * Enter = send
                 * Shift + Enter = new line
                 */
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();

                  if (
                    text.trim() &&
                    !sending
                  ) {
                    sendMessage(event);
                  }
                }

              }}
              placeholder={`Message ${
                otherUser?.name || ""
              }...`}
              rows={1}
              disabled={sending}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
            />

            <button
              type="submit"
              disabled={
                !text.trim() || sending
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-lg text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              aria-label="Send message"
            >
              {sending ? "…" : "➤"}
            </button>

          </div>

          <div className="mt-1 flex items-center justify-between px-2">

            <p className="text-[10px] text-gray-400">
              Enter to send · Shift + Enter for new line
            </p>

            {text.length > 0 && (
              <span className="text-[10px] text-gray-400">
                {text.length}
              </span>
            )}

          </div>

        </form>

      </div>
    </main>
  );
}