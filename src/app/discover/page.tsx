"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type Capability = {
  capability: string;
};

type Skill = {
  skill: string;
};

type Relationship = {
  following: boolean;
  followedBy: boolean;
  friend: boolean;
};

type CollaborationStatus =
  | "NONE"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "SELF";

type RecommendedUser = {
  user: {
    id: string;
    name: string;
    profile?: {
      username?: string | null;
      bio?: string | null;
      location?: string | null;
      avatarUrl?: string | null;
      availability?: string | null;
      capabilities?: Capability[];
      skills?: Skill[];
    } | null;
  };
  score: number;
  reasons: string[];
  relationship: Relationship;
  collaborationStatus?: CollaborationStatus;
};

type DiscoverResponse = {
  success: boolean;
  recommendations: RecommendedUser[];
};

type FollowResponse = {
  success: boolean;
  message: string;
};

type CollaborationResponse = {
  success: boolean;
  message: string;
  collaboration?: {
    id: string;
    status: string;
  };
};

type CollaborationStatusResponse = {
  success: boolean;
  status: CollaborationStatus;
  collaborationId?: string;
  senderId?: string;
  receiverId?: string;
};

export default function DiscoverPage() {
  const [recommendations, setRecommendations] = useState<
    RecommendedUser[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [collaborateUserId, setCollaborateUserId] = useState<string | null>(
    null
  );

  const [collaborationMessage, setCollaborationMessage] = useState("");
  const [collaborationError, setCollaborationError] = useState("");
  const [collaborationSuccess, setCollaborationSuccess] = useState("");

  const loadCollaborationStatuses = async (
    people: RecommendedUser[]
  ) => {
    const updatedPeople = await Promise.all(
      people.map(async (item) => {
        try {
          const result =
            await apiRequest<CollaborationStatusResponse>(
              `/collaborations/status/${item.user.id}`
            );

          return {
            ...item,
            collaborationStatus: result.status,
          };
        } catch {
          return {
            ...item,
            collaborationStatus: "NONE" as CollaborationStatus,
          };
        }
      })
    );

    setRecommendations(updatedPeople);
  };

  const loadDiscover = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest<DiscoverResponse>("/discover/people");

      await loadCollaborationStatuses(data.recommendations || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load recommendations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscover();
  }, []);

  const handleFollow = async (userId: string) => {
    try {
      setActionLoading(userId);

      await apiRequest<FollowResponse>(`/social/follow/${userId}`, {
        method: "POST",
      });

      setRecommendations((current) =>
        current.map((item) =>
          item.user.id === userId
            ? {
                ...item,
                relationship: {
                  ...item.relationship,
                  following: true,
                },
              }
            : item
        )
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to follow user"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      setActionLoading(userId);

      await apiRequest<FollowResponse>(`/social/follow/${userId}`, {
        method: "DELETE",
      });

      setRecommendations((current) =>
        current.map((item) =>
          item.user.id === userId
            ? {
                ...item,
                relationship: {
                  ...item.relationship,
                  following: false,
                },
              }
            : item
        )
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to unfollow user"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openCollaborateModal = (userId: string) => {
    setCollaborateUserId(userId);
    setCollaborationMessage("");
    setCollaborationError("");
    setCollaborationSuccess("");
  };

  const closeCollaborateModal = () => {
    if (actionLoading === "collaborate") return;

    setCollaborateUserId(null);
    setCollaborationMessage("");
    setCollaborationError("");
    setCollaborationSuccess("");
  };

  const submitCollaboration = async () => {
    if (!collaborateUserId) return;

    const message = collaborationMessage.trim();

    if (!message) {
      setCollaborationError(
        "Please describe what you want to collaborate on."
      );
      return;
    }

    if (message.length < 5) {
      setCollaborationError(
        "Please provide a little more detail about the collaboration."
      );
      return;
    }

    try {
      setActionLoading("collaborate");
      setCollaborationError("");
      setCollaborationSuccess("");

      const data = await apiRequest<CollaborationResponse>(
        "/collaborations",
        {
          method: "POST",
          body: JSON.stringify({
            receiverId: collaborateUserId,
            message,
          }),
        }
      );

      setCollaborationSuccess(
        data.message || "Collaboration request sent successfully."
      );

      setRecommendations((current) =>
        current.map((item) =>
          item.user.id === collaborateUserId
            ? {
                ...item,
                collaborationStatus: "PENDING",
              }
            : item
        )
      );

      setCollaborationMessage("");

      setTimeout(() => {
        setCollaborateUserId(null);
        setCollaborationSuccess("");
      }, 1600);
    } catch (err) {
      setCollaborationError(
        err instanceof Error
          ? err.message
          : "Failed to send collaboration request"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatCapability = (value: string) => {
    return value
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getCollaborationButton = (
    status: CollaborationStatus | undefined
  ) => {
    switch (status) {
      case "PENDING":
        return "Request Sent";
      case "ACCEPTED":
        return "Collaborating";
      case "REJECTED":
        return "Collaborate Again";
      default:
        return "Collaborate";
    }
  };

  const selectedUser = recommendations.find(
    (item) => item.user.id === collaborateUserId
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">Loading people for you...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block text-sm text-slate-400 hover:text-white"
            >
              ← Back to Home
            </Link>

            <h1 className="text-3xl font-bold">Discover People</h1>

            <p className="mt-2 text-slate-400">
              Find people, creators, professionals, and businesses relevant
              to you.
            </p>
          </div>

          <button
            onClick={loadDiscover}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {!error && recommendations.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold">
              No recommendations yet
            </h2>

            <p className="mt-2 text-slate-400">
              Complete your profile and add skills or capabilities to get
              better recommendations.
            </p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((item) => {
            const person = item.user;
            const profile = person.profile;

            const collaborationStatus =
              item.collaborationStatus || "NONE";

            const isPending =
              collaborationStatus === "PENDING";

            const isAccepted =
              collaborationStatus === "ACCEPTED";

            return (
              <article
                key={person.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={person.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-xl font-bold">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h2 className="font-semibold">{person.name}</h2>

                      {profile?.username && (
                        <p className="text-sm text-slate-500">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                    {item.score}% match
                  </div>
                </div>

                {profile?.location && (
                  <p className="mt-4 text-sm text-slate-400">
                    📍 {profile.location}
                  </p>
                )}

                {profile?.bio && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                    {profile.bio}
                  </p>
                )}

                {profile?.capabilities &&
                  profile.capabilities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.capabilities.map((capability) => (
                        <span
                          key={capability.capability}
                          className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                        >
                          {formatCapability(capability.capability)}
                        </span>
                      ))}
                    </div>
                  )}

                {profile?.skills && profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill.skill}
                        className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-400"
                      >
                        {skill.skill}
                      </span>
                    ))}
                  </div>
                )}

                {item.reasons.length > 0 && (
                  <div className="mt-4 rounded-lg bg-slate-950/70 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Why you are seeing this
                    </p>

                    <ul className="space-y-1">
                      {item.reasons.slice(0, 3).map((reason, index) => (
                        <li
                          key={`${reason}-${index}`}
                          className="text-xs text-slate-400"
                        >
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/profile/${person.id}`}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    View Profile
                  </Link>

                  {item.relationship.following ? (
                    <button
                      onClick={() => handleUnfollow(person.id)}
                      disabled={actionLoading === person.id}
                      className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === person.id
                        ? "Please wait..."
                        : "Following"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFollow(person.id)}
                      disabled={actionLoading === person.id}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === person.id
                        ? "Please wait..."
                        : "Follow"}
                    </button>
                  )}

                  <button
                    onClick={() => openCollaborateModal(person.id)}
                    disabled={isPending || isAccepted}
                    className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      isPending
                        ? "bg-amber-600"
                        : isAccepted
                        ? "bg-emerald-700"
                        : "bg-emerald-600 hover:bg-emerald-500"
                    }`}
                  >
                    {getCollaborationButton(collaborationStatus)}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {collaborateUserId && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Collaborate with {selectedUser.user.name}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Introduce your idea or explain what you want to work on
                  together.
                </p>
              </div>

              <button
                onClick={closeCollaborateModal}
                className="text-xl text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <textarea
              value={collaborationMessage}
              onChange={(event) =>
                setCollaborationMessage(event.target.value)
              }
              placeholder="Example: I am looking for a photographer for a travel campaign in Guwahati..."
              rows={5}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
            />

            <div className="mt-1 text-right text-xs text-slate-500">
              {collaborationMessage.length}/1000
            </div>

            {collaborationError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {collaborationError}
              </div>
            )}

            {collaborationSuccess && (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {collaborationSuccess}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeCollaborateModal}
                disabled={actionLoading === "collaborate"}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={submitCollaboration}
                disabled={actionLoading === "collaborate"}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === "collaborate"
                  ? "Sending..."
                  : "Send Collaboration Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}