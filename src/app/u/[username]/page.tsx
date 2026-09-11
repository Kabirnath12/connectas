"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface PortfolioPost {
  id: string;
  type: string;
  title: string | null;
  caption: string | null;
  mediaUrl: string | null;
  category: string | null;
  location: string | null;
  createdAt: string;
  _count?: {
    likes: number;
    comments: number;
  };
}

interface Capability {
  id: string;
  capability: string;
}

interface Skill {
  id: string;
  skill: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface ProfileData {
  id: string;
  username: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  website: string | null;
  availability: string | null;
  capabilities: Capability[];
  skills: Skill[];
  socialLinks: SocialLink[];
  user: {
    id: string;
    name: string;
    createdAt: string;
    _count: {
      followers: number;
      following: number;
      posts: number;
    };
    posts: PortfolioPost[];
  };
}

interface ProfileResponse {
  success: boolean;
  profile: ProfileData;
  message?: string;
}

interface MeResponse {
  success: boolean;
  user: {
    id: string;
  };
}

interface FollowStatusResponse {
  success: boolean;
  following: boolean;
  followersCount: number;
  followingCount: number;
}

interface FollowResponse {
  success: boolean;
  following: boolean;
  message: string;
}

interface FriendStatusResponse {
  success: boolean;
  status:
    | "SELF"
    | "NONE"
    | "REQUEST_SENT"
    | "REQUEST_RECEIVED"
    | "FRIENDS";
  requestId: string | null;
}

interface CollaborationResponse {
  success: boolean;
  message: string;
  collaboration: unknown;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params.username || "");

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Follow state
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followError, setFollowError] = useState("");

  // Friend state
  const [friendStatus, setFriendStatus] = useState<
    | "SELF"
    | "NONE"
    | "REQUEST_SENT"
    | "REQUEST_RECEIVED"
    | "FRIENDS"
  >("NONE");

  const [friendRequestId, setFriendRequestId] = useState<string | null>(
    null
  );
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendError, setFriendError] = useState("");

  // Collaboration state
  const [showCollaborate, setShowCollaborate] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [collabError, setCollabError] = useState("");

  // Load public profile
  useEffect(() => {
    if (!username) return;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest<ProfileResponse>(
          `/profile/${encodeURIComponent(username)}`
        );

        setProfile(data.profile);
        setFollowersCount(data.profile.user._count?.followers ?? 0);
        setFollowingCount(data.profile.user._count?.following ?? 0);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  // Load logged-in user's social state
  useEffect(() => {
    if (!profile) return;

    async function loadSocialState() {
      try {
        const token = localStorage.getItem("collabx_token");

        if (!token) return;

        const me = await apiRequest<MeResponse>("/auth/me");
        setCurrentUserId(me.user.id);

        if (me.user.id === profile.user.id) {
          setFriendStatus("SELF");
          return;
        }

        const followStatus = await apiRequest<FollowStatusResponse>(
          `/social/follow/${profile.user.id}/status`
        );

        setFollowing(followStatus.following);
        setFollowersCount(followStatus.followersCount);
        setFollowingCount(followStatus.followingCount);

        const friendStatusData =
          await apiRequest<FriendStatusResponse>(
            `/friends/status/${profile.user.id}`
          );

        setFriendStatus(friendStatusData.status);
        setFriendRequestId(friendStatusData.requestId);
      } catch {
        // Public profile should remain visible even if social state fails
      }
    }

    loadSocialState();
  }, [profile]);

  async function toggleFollow() {
    if (!profile) return;

    const token = localStorage.getItem("collabx_token");

    if (!token) {
      window.location.href = `/login?redirect=/u/${encodeURIComponent(
        username
      )}`;
      return;
    }

    try {
      setFollowLoading(true);
      setFollowError("");

      const data = await apiRequest<FollowResponse>(
        `/social/follow/${profile.user.id}`,
        {
          method: "POST",
        }
      );

      setFollowing(data.following);

      setFollowersCount((current) =>
        data.following ? current + 1 : Math.max(0, current - 1)
      );
    } catch (err) {
      setFollowError(
        err instanceof Error ? err.message : "Failed to update follow status"
      );
    } finally {
      setFollowLoading(false);
    }
  }

  async function sendFriendRequest() {
    if (!profile) return;

    const token = localStorage.getItem("collabx_token");

    if (!token) {
      window.location.href = `/login?redirect=/u/${encodeURIComponent(
        username
      )}`;
      return;
    }

    try {
      setFriendLoading(true);
      setFriendError("");

      await apiRequest(`/friends/request/${profile.user.id}`, {
        method: "POST",
      });

      setFriendStatus("REQUEST_SENT");
      setFriendRequestId(null);
    } catch (err) {
      setFriendError(
        err instanceof Error
          ? err.message
          : "Failed to send friend request"
      );
    } finally {
      setFriendLoading(false);
    }
  }

  async function acceptFriendRequest() {
    if (!friendRequestId) return;

    try {
      setFriendLoading(true);
      setFriendError("");

      await apiRequest(`/friends/request/${friendRequestId}/accept`, {
        method: "POST",
      });

      setFriendStatus("FRIENDS");
    } catch (err) {
      setFriendError(
        err instanceof Error
          ? err.message
          : "Failed to accept friend request"
      );
    } finally {
      setFriendLoading(false);
    }
  }

  async function rejectFriendRequest() {
    if (!friendRequestId) return;

    try {
      setFriendLoading(true);
      setFriendError("");

      await apiRequest(`/friends/request/${friendRequestId}/reject`, {
        method: "POST",
      });

      setFriendStatus("NONE");
      setFriendRequestId(null);
    } catch (err) {
      setFriendError(
        err instanceof Error
          ? err.message
          : "Failed to reject friend request"
      );
    } finally {
      setFriendLoading(false);
    }
  }

  function openCollaboration() {
    setShowCollaborate(true);
    setSuccessMessage("");
    setCollabError("");
  }

  function closeCollaboration() {
    if (sending) return;

    setShowCollaborate(false);
    setMessage("");
    setCollabError("");
  }

  async function submitCollaboration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    const token = localStorage.getItem("collabx_token");

    if (!token) {
      window.location.href = `/login?redirect=/u/${encodeURIComponent(
        username
      )}`;
      return;
    }

    if (!message.trim()) {
      setCollabError("Please write a message.");
      return;
    }

    try {
      setSending(true);
      setCollabError("");
      setSuccessMessage("");

      const data = await apiRequest<CollaborationResponse>(
        "/collaborations",
        {
          method: "POST",
          body: JSON.stringify({
            receiverId: profile.user.id,
            message: message.trim(),
          }),
        }
      );

      setSuccessMessage(
        data.message || "Collaboration request sent successfully."
      );
      setMessage("");
    } catch (err) {
      setCollabError(
        err instanceof Error
          ? err.message
          : "Failed to send collaboration request"
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse rounded-3xl bg-white p-8 shadow-sm">
            <div className="h-8 w-64 rounded bg-gray-200" />
            <div className="mt-4 h-4 w-96 rounded bg-gray-200" />
            <div className="mt-8 h-32 rounded bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Profile unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "This profile could not be found."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-3 font-semibold text-white"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  const posts = profile.user?.posts || [];
  const isOwnProfile = currentUserId === profile.user.id;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-black"
          >
            CONNECTAS
          </Link>

          <span className="text-sm font-medium text-gray-500">
            CONNECTAS PROFILE
          </span>
        </div>

        {/* Profile Card */}
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          {/* Cover */}
          <div className="h-40 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 md:h-56" />

          <div className="px-6 pb-8 md:px-10">
            {/* Avatar */}
            <div className="-mt-16 flex flex-col gap-5 md:-mt-20 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-5">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.user.name}
                    className="h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-lg md:h-40 md:w-40"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-gray-900 text-4xl font-black text-white shadow-lg md:h-40 md:w-40">
                    {profile.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                <div className="pb-2">
                  <h1 className="text-2xl font-black text-gray-950 md:text-4xl">
                    {profile.user.name}
                  </h1>

                  <p className="mt-1 text-gray-500">
                    @{profile.username}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-3">
                  {/* Follow */}
                  <button
                    type="button"
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={`rounded-xl px-5 py-3 font-semibold transition ${
                      following
                        ? "border border-gray-300 bg-white text-black"
                        : "bg-black text-white hover:bg-gray-800"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {followLoading
                      ? "..."
                      : following
                        ? "Following"
                        : "Follow"}
                  </button>

                  {/* Friend */}
                  {friendStatus === "REQUEST_RECEIVED" ? (
                    <>
                      <button
                        type="button"
                        onClick={acceptFriendRequest}
                        disabled={friendLoading}
                        className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-70"
                      >
                        {friendLoading ? "..." : "Accept"}
                      </button>

                      <button
                        type="button"
                        onClick={rejectFriendRequest}
                        disabled={friendLoading}
                        className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-70"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        friendLoading ||
                        friendStatus === "REQUEST_SENT" ||
                        friendStatus === "FRIENDS"
                      }
                      onClick={sendFriendRequest}
                      className={`rounded-xl px-5 py-3 font-semibold transition ${
                        friendStatus === "FRIENDS"
                          ? "border border-green-300 bg-green-50 text-green-700"
                          : friendStatus === "REQUEST_SENT"
                            ? "border border-gray-300 bg-gray-100 text-gray-600"
                            : "border border-gray-300 bg-white text-black hover:bg-gray-50"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {friendLoading
                        ? "..."
                        : friendStatus === "FRIENDS"
                          ? "Friends"
                          : friendStatus === "REQUEST_SENT"
                            ? "Request Sent"
                            : "Add Friend"}
                    </button>
                  )}

                  {/* Collaborate */}
                  <button
                    type="button"
                    onClick={openCollaboration}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-50"
                  >
                    Collaborate
                  </button>

                  {/* Message */}
                  <button
                    type="button"
                    onClick={() =>
                      alert("Messaging will be connected next.")
                    }
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-50"
                  >
                    Message
                  </button>
                </div>
              )}
            </div>

            {/* Basic Details */}
            <div className="mt-7 max-w-3xl">
              {profile.bio && (
                <p className="text-lg leading-8 text-gray-700">
                  {profile.bio}
                </p>
              )}

              {profile.location && (
                <p className="mt-4 text-sm text-gray-600">
                  📍 {profile.location}
                </p>
              )}

              {profile.website && (
                <a
                  href={
                    profile.website.startsWith("http")
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
                >
                  Visit website
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4 border-y border-gray-100 py-6">
              <div>
                <p className="text-2xl font-black text-gray-950">
                  {posts.length}
                </p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>

              <div>
                <p className="text-2xl font-black text-gray-950">
                  {followersCount}
                </p>
                <p className="text-sm text-gray-500">Followers</p>
              </div>

              <div>
                <p className="text-2xl font-black text-gray-950">
                  {followingCount}
                </p>
                <p className="text-sm text-gray-500">Following</p>
              </div>
            </div>

            {/* Errors */}
            {followError && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {followError}
              </p>
            )}

            {friendError && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {friendError}
              </p>
            )}

            {/* Capabilities */}
            {profile.capabilities?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-950">
                  Capabilities
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.capabilities.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                    >
                      {item.capability
                        .replaceAll("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-950">Skills</h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
                    >
                      {item.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {profile.socialLinks?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-950">
                  Social Links
                </h2>

                <div className="mt-3 flex flex-wrap gap-3">
                  {profile.socialLinks.map((item) => (
                    <a
                      key={item.id}
                      href={
                        item.url.startsWith("http")
                          ? item.url
                          : `https://${item.url}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50"
                    >
                      {item.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Posts */}
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-950">
              Portfolio & Posts
            </h2>

            <span className="text-sm text-gray-500">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-gray-700">
                No public posts yet
              </p>

              <p className="mt-2 text-sm text-gray-500">
                This user has not published any portfolio content.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                >
                  {post.mediaUrl && (
                    <img
                      src={post.mediaUrl}
                      alt={post.title || "Portfolio post"}
                      className="h-64 w-full object-cover"
                    />
                  )}

                  <div className="p-6">
                    {post.category && (
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        {post.category}
                      </span>
                    )}

                    {post.title && (
                      <h3 className="mt-2 text-xl font-bold text-gray-950">
                        {post.title}
                      </h3>
                    )}

                    {post.caption && (
                      <p className="mt-3 leading-7 text-gray-600">
                        {post.caption}
                      </p>
                    )}

                    {post.location && (
                      <p className="mt-3 text-sm text-gray-500">
                        📍 {post.location}
                      </p>
                    )}

                    <div className="mt-5 flex gap-5 text-sm text-gray-500">
                      <span>♥ {post._count?.likes ?? 0}</span>
                      <span>💬 {post._count?.comments ?? 0}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Collaboration Modal */}
      {showCollaborate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-950">
                Collaborate with {profile.user.name}
              </h2>

              <button
                type="button"
                onClick={closeCollaboration}
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Introduce your idea, project, service, or collaboration request.
            </p>

            <form
              onSubmit={submitCollaboration}
              className="mt-6 space-y-4"
            >
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your collaboration message..."
                rows={6}
                className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              {collabError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {collabError}
                </p>
              )}

              {successMessage && (
                <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCollaboration}
                  disabled={sending}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-70"
                >
                  {sending ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}