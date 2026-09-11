"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type Profile = {
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
};

type User = {
  id: string;
  name: string;
  email?: string;
  profile?: Profile | null;
};

type Collaboration = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  sender: User;
  receiver: User;
};

type CollaborationResponse = {
  success: boolean;
  collaborations: Collaboration[];
};

type ActionResponse = {
  success: boolean;
  message: string;
  conversationId?: string;
};

export default function CollaborationsPage() {
  const [collaborations, setCollaborations] = useState<
    Collaboration[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [actionLoading, setActionLoading] = useState<string | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<
    "incoming" | "sent" | "active" | "all"
  >("incoming");

  const loadCurrentUser = async () => {
    try {
      const data = await apiRequest<{
        success: boolean;
        user: {
          id: string;
        };
      }>("/auth/me");

      setCurrentUserId(data.user.id);
    } catch {
      // Current user may already be available through collaboration data.
    }
  };

  const loadCollaborations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest<CollaborationResponse>(
        "/collaborations"
      );

      setCollaborations(data.collaborations || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load collaborations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadCollaborations();
  }, []);

  const acceptRequest = async (collaborationId: string) => {
    try {
      setActionLoading(collaborationId);

      await apiRequest<ActionResponse>(
        `/collaborations/${collaborationId}/accept`,
        {
          method: "PUT",
        }
      );

      await loadCollaborations();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to accept collaboration"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (collaborationId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this collaboration request?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(collaborationId);

      await apiRequest<ActionResponse>(
        `/collaborations/${collaborationId}/reject`,
        {
          method: "PUT",
        }
      );

      await loadCollaborations();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to reject collaboration"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getOtherUser = (collaboration: Collaboration) => {
    return collaboration.senderId === currentUserId
      ? collaboration.receiver
      : collaboration.sender;
  };

  const incoming = collaborations.filter(
    (collaboration) =>
      collaboration.receiverId === currentUserId &&
      collaboration.status === "PENDING"
  );

  const sent = collaborations.filter(
    (collaboration) =>
      collaboration.senderId === currentUserId &&
      collaboration.status === "PENDING"
  );

  const active = collaborations.filter(
    (collaboration) => collaboration.status === "ACCEPTED"
  );

  const filteredCollaborations =
    activeTab === "incoming"
      ? incoming
      : activeTab === "sent"
      ? sent
      : activeTab === "active"
      ? active
      : collaborations;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/15 text-amber-300";
      case "ACCEPTED":
        return "bg-emerald-500/15 text-emerald-300";
      case "REJECTED":
        return "bg-red-500/15 text-red-300";
      case "COMPLETED":
        return "bg-blue-500/15 text-blue-300";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">
            Loading collaborations...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-3 inline-block text-sm text-slate-400 hover:text-white"
          >
            ← Back to Home
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold">
                My Collaborations
              </h1>

              <p className="mt-2 text-slate-400">
                Manage collaboration requests, active projects, and
                professional connections.
              </p>
            </div>

            <button
              onClick={loadCollaborations}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === "incoming"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Incoming
            {incoming.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-black">
                {incoming.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === "sent"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Sent
            {sent.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs">
                {sent.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === "active"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Active
            {active.length > 0 && (
              <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs">
                {active.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === "all"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            All
          </button>
        </div>

        {filteredCollaborations.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="mb-3 text-4xl">🤝</div>

            <h2 className="text-xl font-semibold">
              No collaborations here
            </h2>

            <p className="mt-2 text-slate-400">
              Your collaboration requests and active projects will
              appear here.
            </p>

            <Link
              href="/discover"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
            >
              Discover People
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCollaborations.map((collaboration) => {
              const otherUser = getOtherUser(collaboration);

              const isIncoming =
                collaboration.receiverId === currentUserId &&
                collaboration.status === "PENDING";

              const isAccepted =
                collaboration.status === "ACCEPTED";

              return (
                <article
                  key={collaboration.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row">
                    <div className="flex gap-4">
                      {otherUser.profile?.avatarUrl ? (
                        <img
                          src={otherUser.profile.avatarUrl}
                          alt={otherUser.name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xl font-bold">
                          {otherUser.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-semibold">
                            {otherUser.name}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                              collaboration.status
                            )}`}
                          >
                            {collaboration.status}
                          </span>
                        </div>

                        {otherUser.profile?.username && (
                          <p className="text-sm text-slate-500">
                            @{otherUser.profile.username}
                          </p>
                        )}

                        {otherUser.profile?.location && (
                          <p className="mt-1 text-sm text-slate-400">
                            📍 {otherUser.profile.location}
                          </p>
                        )}

                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {collaboration.message ||
                            "No message provided."}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                          Created on{" "}
                          {formatDate(collaboration.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 md:self-center">
                      {isIncoming && (
                        <>
                          <button
                            onClick={() =>
                              acceptRequest(collaboration.id)
                            }
                            disabled={
                              actionLoading === collaboration.id
                            }
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {actionLoading === collaboration.id
                              ? "Please wait..."
                              : "Accept"}
                          </button>

                          <button
                            onClick={() =>
                              rejectRequest(collaboration.id)
                            }
                            disabled={
                              actionLoading === collaboration.id
                            }
                            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isAccepted && (
                        <Link
                          href="/messages"
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                          Open Messages
                        </Link>
                      )}

                      <Link
                        href={`/profile/${otherUser.id}`}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}