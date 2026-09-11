"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type Profile = {
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

type User = {
  id: string;
  name: string;
  email?: string;
  profile?: Profile | null;
};

type FriendRequest = {
  id: string;
  sender?: User;
  receiver?: User;
  createdAt?: string;
};

type Friend = {
  id: string;
  name: string;
  profile?: Profile | null;
};

type SocialUser = {
  id: string;
  name: string;
  profile?: Profile | null;
};

function initials(name?: string) {
  return (name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ user }: { user?: User | Friend | SocialUser }) {
  const name = user?.name || "User";
  const avatarUrl = user?.profile?.avatarUrl;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function UserRow({
  user,
  action,
}: {
  user: User | Friend | SocialUser;
  action?: React.ReactNode;
}) {
  const username = user.profile?.username;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar user={user} />

        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{user.name}</p>

          {username ? (
            <Link
              href={`/u/${username}`}
              className="text-sm text-cyan-400 hover:underline"
            >
              @{username}
            </Link>
          ) : (
            <p className="text-sm text-slate-500">ConnectAS member</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

export default function ConnectionsPage() {
  const [tab, setTab] = useState<
    "overview" | "requests" | "sent" | "friends" | "followers" | "following"
  >("overview");

  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadConnections() {
    try {
      setLoading(true);

      const [
        incomingResponse,
        sentResponse,
        friendsResponse,
        followersResponse,
        followingResponse,
      ] = await Promise.all([
        apiRequest<any>("/friends/requests"),
        apiRequest<any>("/friends/sent"),
        apiRequest<any>("/friends/list"),
        apiRequest<any>("/friends/followers"),
        apiRequest<any>("/friends/following"),
      ]);

      setIncoming(
        incomingResponse.requests ||
          incomingResponse.friendRequests ||
          incomingResponse.data ||
          []
      );

      setSent(
        sentResponse.requests ||
          sentResponse.friendRequests ||
          sentResponse.data ||
          []
      );

      setFriends(friendsResponse.friends || friendsResponse.data || []);
      setFollowers(followersResponse.followers || followersResponse.data || []);
      setFollowing(followingResponse.following || followingResponse.data || []);
    } catch (error) {
      console.error("Connections loading error:", error);
      setMessage("Unable to load connections. Please log in again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConnections();
  }, []);

  async function acceptRequest(requestId: string) {
    try {
      await apiRequest(`/friends/request/${requestId}/accept`, {
        method: "POST",
      });

      setMessage("Friend request accepted.");
      await loadConnections();
    } catch {
      setMessage("Could not accept this request.");
    }
  }

  async function rejectRequest(requestId: string) {
    try {
      await apiRequest(`/friends/request/${requestId}/reject`, {
        method: "POST",
      });

      setMessage("Friend request rejected.");
      await loadConnections();
    } catch {
      setMessage("Could not reject this request.");
    }
  }

  async function cancelRequest(requestId: string) {
    try {
      await apiRequest(`/friends/request/${requestId}/cancel`, {
        method: "POST",
      });

      setMessage("Friend request cancelled.");
      await loadConnections();
    } catch {
      setMessage("Could not cancel this request.");
    }
  }

  async function followBack(userId: string) {
    try {
      await apiRequest(`/social/follow/${userId}`, {
        method: "POST",
      });

      setMessage("Follow status updated.");
      await loadConnections();
    } catch {
      setMessage("Could not update follow status.");
    }
  }

  async function unfollow(userId: string) {
    try {
      await apiRequest(`/social/follow/${userId}`, {
        method: "POST",
      });

      setMessage("Unfollowed successfully.");
      await loadConnections();
    } catch {
      setMessage("Could not unfollow this user.");
    }
  }

  const filteredFriends = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return friends;

    return friends.filter((user) =>
      `${user.name} ${user.profile?.username || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [friends, search]);

  const filteredFollowers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return followers;

    return followers.filter((user) =>
      `${user.name} ${user.profile?.username || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [followers, search]);

  const filteredFollowing = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return following;

    return following.filter((user) =>
      `${user.name} ${user.profile?.username || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [following, search]);

  const tabs = [
    ["overview", "Overview"],
    ["requests", `Requests ${incoming.length ? `(${incoming.length})` : ""}`],
    ["sent", "Sent"],
    ["friends", `Friends (${friends.length})`],
    ["followers", `Followers (${followers.length})`],
    ["following", `Following (${following.length})`],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            ConnectAS Network
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">Connections Center</h1>

          <p className="mt-2 text-slate-400">
            Manage your friends, followers, following, and connection requests.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            {message}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            onClick={() => setTab("friends")}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left hover:border-cyan-500/50"
          >
            <p className="text-sm text-slate-400">Friends</p>
            <p className="mt-2 text-3xl font-bold">{friends.length}</p>
          </button>

          <button
            onClick={() => setTab("requests")}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left hover:border-cyan-500/50"
          >
            <p className="text-sm text-slate-400">Requests</p>
            <p className="mt-2 text-3xl font-bold">{incoming.length}</p>
          </button>

          <button
            onClick={() => setTab("followers")}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left hover:border-cyan-500/50"
          >
            <p className="text-sm text-slate-400">Followers</p>
            <p className="mt-2 text-3xl font-bold">{followers.length}</p>
          </button>

          <button
            onClick={() => setTab("following")}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left hover:border-cyan-500/50"
          >
            <p className="text-sm text-slate-400">Following</p>
            <p className="mt-2 text-3xl font-bold">{following.length}</p>
          </button>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-2">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setSearch("");
              }}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium ${
                tab === value
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <section className="grid gap-5 md:grid-cols-2">
            <button
              onClick={() => setTab("requests")}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-cyan-500/50"
            >
              <h2 className="text-xl font-bold">Incoming Requests</h2>
              <p className="mt-2 text-slate-400">
                Review people who want to connect with you.
              </p>
              <p className="mt-5 text-3xl font-bold text-cyan-400">
                {incoming.length}
              </p>
            </button>

            <button
              onClick={() => setTab("sent")}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-cyan-500/50"
            >
              <h2 className="text-xl font-bold">Sent Requests</h2>
              <p className="mt-2 text-slate-400">
                Manage pending requests you have sent.
              </p>
              <p className="mt-5 text-3xl font-bold text-cyan-400">
                {sent.length}
              </p>
            </button>

            <button
              onClick={() => setTab("friends")}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-cyan-500/50"
            >
              <h2 className="text-xl font-bold">Your Friends</h2>
              <p className="mt-2 text-slate-400">
                View and message your confirmed connections.
              </p>
              <p className="mt-5 text-3xl font-bold text-cyan-400">
                {friends.length}
              </p>
            </button>

            <button
              onClick={() => setTab("followers")}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-cyan-500/50"
            >
              <h2 className="text-xl font-bold">Audience</h2>
              <p className="mt-2 text-slate-400">
                See who follows your ConnectAS profile.
              </p>
              <p className="mt-5 text-3xl font-bold text-cyan-400">
                {followers.length}
              </p>
            </button>
          </section>
        )}

        {tab !== "overview" && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            {(tab === "friends" ||
              tab === "followers" ||
              tab === "following") && (
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search connections..."
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
              />
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                Loading connections...
              </div>
            ) : (
              <>
                {tab === "requests" && (
                  <div>
                    <h2 className="mb-3 text-xl font-bold">
                      Incoming Friend Requests
                    </h2>

                    {incoming.length === 0 ? (
                      <p className="py-8 text-center text-slate-500">
                        No pending requests.
                      </p>
                    ) : (
                      incoming.map((request) => (
                        <UserRow
                          key={request.id}
                          user={request.sender}
                          action={
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRequest(request.id)}
                                className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => rejectRequest(request.id)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"
                              >
                                Reject
                              </button>
                            </div>
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {tab === "sent" && (
                  <div>
                    <h2 className="mb-3 text-xl font-bold">Sent Requests</h2>

                    {sent.length === 0 ? (
                      <p className="py-8 text-center text-slate-500">
                        No sent requests.
                      </p>
                    ) : (
                      sent.map((request) => (
                        <UserRow
                          key={request.id}
                          user={request.receiver}
                          action={
                            <button
                              onClick={() => cancelRequest(request.id)}
                              className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300"
                            >
                              Cancel
                            </button>
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {tab === "friends" && (
                  <div>
                    <h2 className="mb-3 text-xl font-bold">Your Friends</h2>

                    {filteredFriends.length === 0 ? (
                      <p className="py-8 text-center text-slate-500">
                        No friends found.
                      </p>
                    ) : (
                      filteredFriends.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          action={
                            <Link
                              href={
                                user.profile?.username
                                  ? `/u/${user.profile.username}`
                                  : "#"
                              }
                              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-cyan-300"
                            >
                              View
                            </Link>
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {tab === "followers" && (
                  <div>
                    <h2 className="mb-3 text-xl font-bold">Followers</h2>

                    {filteredFollowers.length === 0 ? (
                      <p className="py-8 text-center text-slate-500">
                        No followers found.
                      </p>
                    ) : (
                      filteredFollowers.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          action={
                            <button
                              onClick={() => followBack(user.id)}
                              className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
                            >
                              Follow Back
                            </button>
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {tab === "following" && (
                  <div>
                    <h2 className="mb-3 text-xl font-bold">Following</h2>

                    {filteredFollowing.length === 0 ? (
                      <p className="py-8 text-center text-slate-500">
                        You are not following anyone.
                      </p>
                    ) : (
                      filteredFollowing.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          action={
                            <button
                              onClick={() => unfollow(user.id)}
                              className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300"
                            >
                              Unfollow
                            </button>
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}