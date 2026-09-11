"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Capability = {
  id?: string;
  capability: string;
};

type SocialLink = {
  id?: string;
  platform: string;
  url: string;
};

type Profile = {
  id: string;
  userId: string;
  username: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  availability?: string | null;
  professionalTitle?: string | null;
  industry?: string | null;
  experienceLevel?: string | null;
  workPreference?: string | null;
  isAvailableForWork?: boolean;
  expectedSalary?: string | null;
  hourlyRate?: string | null;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  capabilities?: Capability[];
  skills?: string[];
  socialLinks?: SocialLink[];
};

type User = {
  id: string;
  name: string;
  email?: string;
  profile?: Profile | null;
};

type Post = {
  id: string;
  title?: string | null;
  caption?: string | null;
  mediaUrl?: string | null;
  category?: string | null;
  location?: string | null;
  createdAt: string;
  likes?: unknown[];
  comments?: unknown[];
  _count?: {
    likes?: number;
    comments?: number;
  };
};

type ProfileResponse = {
  success: boolean;
  user?: User;
  profile?: Profile | null;
  posts?: Post[];
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  message?: string;
};

type FollowStatus = {
  following: boolean;
  followersCount?: number;
  followingCount?: number;
};

type FriendStatusResponse = {
  status:
    | "NONE"
    | "PENDING_SENT"
    | "PENDING_RECEIVED"
    | "ACCEPTED"
    | "REJECTED";
  requestId?: string | null;
};

function getInitials(name?: string) {
  return (name || "User")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeUrl(url?: string | null) {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return `https://${url}`;
}

function Avatar({
  name,
  src,
  size = "large",
}: {
  name: string;
  src?: string | null;
  size?: "small" | "large";
}) {
  const [failed, setFailed] = useState(false);
  const imageUrl = normalizeUrl(src);

  const dimensions =
    size === "large" ? "h-28 w-28 md:h-36 md:w-36" : "h-12 w-12";

  if (!imageUrl || failed) {
    return (
      <div
        className={`flex ${dimensions} items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 font-bold text-white ${
          size === "large" ? "text-4xl" : "text-lg"
        }`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setFailed(true)}
      className={`${dimensions} rounded-full object-cover`}
    />
  );
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params.username || "");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    following: false,
  });

  const [friendStatus, setFriendStatus] =
    useState<FriendStatusResponse | null>(null);

  const [friendRequestId, setFriendRequestId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);

  const [error, setError] = useState("");
  const [friendError, setFriendError] = useState("");
  const [showCollaborate, setShowCollaborate] = useState(false);
  const [collaborationMessage, setCollaborationMessage] = useState("");
  const [collaborationLoading, setCollaborationLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest<ProfileResponse>(
        `/profile/${encodeURIComponent(username)}`
      );

      if (!response.success) {
        throw new Error(response.message || "Profile not found");
      }

      setUser(response.user || null);
      setProfile(response.profile || response.user?.profile || null);
      setPosts(response.posts || []);

      setFollowersCount(response.followersCount || 0);
      setFollowingCount(response.followingCount || 0);
      setPostsCount(response.postsCount || response.posts?.length || 0);

      if (response.user?.id) {
        await loadSocialStatus(response.user.id);
      }
    } catch (err) {
      console.error("Public profile error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load this profile"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSocialStatus(userId: string) {
    try {
      const [followResponse, friendResponse] = await Promise.all([
        apiRequest<FollowStatus>(`/social/follow/${userId}/status`),
        apiRequest<FriendStatusResponse>(`/friends/status/${userId}`),
      ]);

      setFollowStatus({
        following: Boolean(followResponse.following),
        followersCount: followResponse.followersCount,
        followingCount: followResponse.followingCount,
      });

      setFriendStatus(friendResponse);
      setFriendRequestId(friendResponse.requestId || null);
    } catch (err) {
      console.error("Social status error:", err);
    }
  }

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  async function toggleFollow() {
    if (!user?.id || followLoading) return;

    try {
      setFollowLoading(true);

      const response = await apiRequest<FollowStatus>(
        `/social/follow/${user.id}`,
        {
          method: "POST",
        }
      );

      setFollowStatus((previous) => ({
        ...previous,
        following: Boolean(response.following),
        followersCount:
          response.followersCount ??
          previous.followersCount ??
          followersCount,
      }));

      if (typeof response.followersCount === "number") {
        setFollowersCount(response.followersCount);
      }
    } catch (err) {
      console.error("Follow error:", err);
      setError("Unable to update follow status.");
    } finally {
      setFollowLoading(false);
    }
  }

  async function sendFriendRequest() {
    if (!user?.id || friendLoading) return;

    try {
      setFriendLoading(true);
      setFriendError("");

      const response = await apiRequest<any>(`/friends/request/${user.id}`, {
        method: "POST",
      });

      setFriendStatus({
        status: "PENDING_SENT",
        requestId: response.request?.id || response.requestId || null,
      });

      setFriendRequestId(response.request?.id || response.requestId || null);
      setSuccessMessage("Friend request sent.");
    } catch (err: any) {
      console.error("Friend request error:", err);

      if (err?.message?.toLowerCase().includes("already")) {
        setFriendError("A friend request already exists.");
      } else {
        setFriendError(err?.message || "Unable to send friend request.");
      }
    } finally {
      setFriendLoading(false);
    }
  }

  async function acceptFriendRequest() {
    if (!friendRequestId || friendLoading) return;

    try {
      setFriendLoading(true);
      setFriendError("");

      await apiRequest(`/friends/request/${friendRequestId}/accept`, {
        method: "POST",
      });

      setFriendStatus({
        status: "ACCEPTED",
        requestId: friendRequestId,
      });

      setSuccessMessage("Friend request accepted.");
    } catch (err: any) {
      setFriendError(err?.message || "Unable to accept request.");
    } finally {
      setFriendLoading(false);
    }
  }

  async function rejectFriendRequest() {
    if (!friendRequestId || friendLoading) return;

    try {
      setFriendLoading(true);
      setFriendError("");

      await apiRequest(`/friends/request/${friendRequestId}/reject`, {
        method: "POST",
      });

      setFriendStatus({
        status: "NONE",
        requestId: null,
      });

      setFriendRequestId(null);
      setSuccessMessage("Friend request rejected.");
    } catch (err: any) {
      setFriendError(err?.message || "Unable to reject request.");
    } finally {
      setFriendLoading(false);
    }
  }

  async function submitCollaboration() {
    if (!user?.id || !collaborationMessage.trim()) return;

    try {
      setCollaborationLoading(true);

      await apiRequest("/collaborations", {
        method: "POST",
        body: JSON.stringify({
          receiverId: user.id,
          message: collaborationMessage.trim(),
        }),
      });

      setShowCollaborate(false);
      setCollaborationMessage("");
      setSuccessMessage("Collaboration request sent successfully.");
    } catch (err: any) {
      setError(err?.message || "Unable to send collaboration request.");
    } finally {
      setCollaborationLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-56 rounded-3xl bg-slate-900" />
          <div className="mt-6 h-8 w-64 rounded bg-slate-800" />
          <div className="mt-3 h-5 w-96 rounded bg-slate-900" />
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <p className="mt-3 text-slate-400">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
          >
            Back to ConnectAS
          </Link>
        </div>
      </main>
    );
  }

  // Important TypeScript null guard for production builds.
  if (!profile || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Profile unavailable</h1>
          <p className="mt-2 text-slate-400">
            This profile could not be loaded.
          </p>
        </div>
      </main>
    );
  }

  const displayName = user.name || profile.username;
  const websiteUrl = normalizeUrl(profile.website);
  const portfolioUrl = normalizeUrl(profile.portfolioUrl);
  const coverUrl = normalizeUrl(profile.coverUrl);

  const isPendingSent = friendStatus?.status === "PENDING_SENT";
  const isPendingReceived = friendStatus?.status === "PENDING_RECEIVED";
  const isFriends = friendStatus?.status === "ACCEPTED";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="relative h-48 bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 md:h-64">
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Profile cover"
                className="h-full w-full object-cover opacity-80"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

            <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-bold tracking-[0.2em] text-cyan-200 backdrop-blur">
              CONNECTAS PROFILE
            </div>
          </div>

          <div className="relative px-6 pb-7 md:px-10">
            <div className="-mt-16 flex flex-col gap-5 md:-mt-20 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="rounded-full border-4 border-slate-900">
                  <Avatar
                    name={displayName}
                    src={profile.avatarUrl}
                    size="large"
                  />
                </div>

                <div className="pb-1">
                  <h1 className="text-3xl font-bold md:text-4xl">
                    {displayName}
                  </h1>

                  <p className="mt-1 text-cyan-400">
                    @{profile.username}
                  </p>

                  {profile.professionalTitle && (
                    <p className="mt-2 text-slate-300">
                      {profile.professionalTitle}
                    </p>
                  )}

                  {profile.location && (
                    <p className="mt-2 text-sm text-slate-400">
                      📍 {profile.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    followStatus.following
                      ? "border border-slate-700 bg-slate-800 text-white"
                      : "bg-cyan-500 text-slate-950"
                  }`}
                >
                  {followLoading
                    ? "Please wait..."
                    : followStatus.following
                    ? "Following"
                    : "Follow"}
                </button>

                {!isFriends && !isPendingSent && !isPendingReceived && (
                  <button
                    onClick={sendFriendRequest}
                    disabled={friendLoading}
                    className="rounded-xl border border-cyan-500/50 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10"
                  >
                    {friendLoading ? "Please wait..." : "Add Friend"}
                  </button>
                )}

                {isPendingSent && (
                  <button
                    disabled
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400"
                  >
                    Request Sent
                  </button>
                )}

                {isPendingReceived && (
                  <>
                    <button
                      onClick={acceptFriendRequest}
                      disabled={friendLoading}
                      className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
                    >
                      Accept
                    </button>

                    <button
                      onClick={rejectFriendRequest}
                      disabled={friendLoading}
                      className="rounded-xl border border-red-500/40 px-4 py-2.5 text-sm text-red-300"
                    >
                      Reject
                    </button>
                  </>
                )}

                {isFriends && (
                  <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300">
                    Friends
                  </span>
                )}

                <button
                  onClick={() => setShowCollaborate(true)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Collaborate
                </button>

                <button
                  onClick={() =>
                    setSuccessMessage("Messaging will be available soon.")
                  }
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Message
                </button>
              </div>
            </div>

            {successMessage && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            {friendError && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {friendError}
              </div>
            )}

            <div className="mt-7 grid grid-cols-3 gap-3 border-y border-slate-800 py-5 text-center">
              <div>
                <p className="text-2xl font-bold">{postsCount}</p>
                <p className="text-sm text-slate-500">Posts</p>
              </div>

              <div>
                <p className="text-2xl font-bold">{followersCount}</p>
                <p className="text-sm text-slate-500">Followers</p>
              </div>

              <div>
                <p className="text-2xl font-bold">{followingCount}</p>
                <p className="text-sm text-slate-500">Following</p>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-7">
                <h2 className="mb-2 text-lg font-bold">About</h2>
                <p className="whitespace-pre-wrap leading-7 text-slate-300">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-3 text-lg font-bold">Capabilities</h2>

                <div className="flex flex-wrap gap-2">
                  {(profile.capabilities || []).length > 0 ? (
                    profile.capabilities?.map((item, index) => (
                      <span
                        key={item.id || `${item.capability}-${index}`}
                        className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-300"
                      >
                        {item.capability}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No capabilities added.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-lg font-bold">Skills</h2>

                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).length > 0 ? (
                    profile.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No skills added.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {(websiteUrl || portfolioUrl || profile.resumeUrl) && (
              <div className="mt-7 flex flex-wrap gap-3">
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-cyan-300 hover:bg-slate-800"
                  >
                    Website
                  </a>
                )}

                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-cyan-300 hover:bg-slate-800"
                  >
                    Portfolio
                  </a>
                )}

                {profile.resumeUrl && (
                  <a
                    href={normalizeUrl(profile.resumeUrl) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-cyan-300 hover:bg-slate-800"
                  >
                    Resume
                  </a>
                )}
              </div>
            )}

            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div className="mt-7">
                <h2 className="mb-3 text-lg font-bold">Social Links</h2>

                <div className="flex flex-wrap gap-3">
                  {profile.socialLinks.map((link, index) => (
                    <a
                      key={link.id || `${link.platform}-${index}`}
                      href={normalizeUrl(link.url) || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Public Work
              </p>
              <h2 className="mt-1 text-2xl font-bold">Posts & Projects</h2>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-14 text-center">
              <p className="text-lg font-semibold text-slate-300">
                No public posts yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                This person has not published any public work.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                >
                  {post.mediaUrl && (
                    <img
                      src={normalizeUrl(post.mediaUrl) || ""}
                      alt={post.title || "Post media"}
                      className="max-h-80 w-full object-cover"
                    />
                  )}

                  <div className="p-5">
                    {post.title && (
                      <h3 className="text-lg font-bold">{post.title}</h3>
                    )}

                    {post.caption && (
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-300">
                        {post.caption}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(post.createdAt)}</span>

                      <span>
                        ❤️ {post._count?.likes ?? post.likes?.length ?? 0}
                        {"  "}
                        💬{" "}
                        {post._count?.comments ?? post.comments?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {showCollaborate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Collaborate with {displayName}</h2>

              <button
                onClick={() => setShowCollaborate(false)}
                className="text-2xl text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Explain what you would like to collaborate on.
            </p>

            <textarea
              value={collaborationMessage}
              onChange={(event) =>
                setCollaborationMessage(event.target.value)
              }
              placeholder="Write your collaboration proposal..."
              rows={5}
              className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-white outline-none focus:border-cyan-500"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowCollaborate(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300"
              >
                Cancel
              </button>

              <button
                onClick={submitCollaboration}
                disabled={
                  collaborationLoading || !collaborationMessage.trim()
                }
                className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {collaborationLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}