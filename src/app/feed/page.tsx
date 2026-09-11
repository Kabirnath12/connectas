"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { apiRequest } from "@/lib/api";

type Post = {
  id: string;
  type: "PORTFOLIO" | "UPDATE" | "OPPORTUNITY";
  title?: string | null;
  caption?: string | null;
  mediaUrl?: string | null;
  category?: string | null;
  location?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profile?: {
      username?: string | null;
      avatarUrl?: string | null;
    } | null;
  };
  _count?: {
    likes: number;
    comments: number;
  };
};

type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  profile?: {
    username?: string | null;
    avatarUrl?: string | null;
  } | null;
};

type MediaPreview = {
  file: File;
  url: string;
  type: "image" | "video";
};

export default function FeedPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [collaboratePost, setCollaboratePost] = useState<Post | null>(null);

  const [collaborationMessage, setCollaborationMessage] = useState("");
  const [sendingCollaboration, setSendingCollaboration] = useState(false);

  const [postType, setPostType] =
    useState<"PORTFOLIO" | "UPDATE" | "OPPORTUNITY">("UPDATE");

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const [media, setMedia] = useState<MediaPreview | null>(null);

  async function loadUser() {
    try {
      const response = await apiRequest<{ user: CurrentUser }>("/auth/me");
      setCurrentUser(response.user);
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  }

  async function loadFeed() {
    try {
      setLoading(true);

      const response = await apiRequest<{ posts: Post[] }>("/posts/feed");

      setPosts(response.posts || []);
    } catch (error) {
      console.error("Failed to load feed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    loadFeed();
  }, []);

  function openComposer() {
    setComposerOpen(true);
  }

  function closeComposer() {
    if (publishing) return;

    if (media) {
      URL.revokeObjectURL(media.url);
    }

    setComposerOpen(false);
    setPostType("UPDATE");
    setTitle("");
    setCaption("");
    setCategory("");
    setLocation("");
    setMedia(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleMediaSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Please select an image or video.");
      return;
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Please choose a file smaller than 100 MB.");
      return;
    }

    if (media) {
      URL.revokeObjectURL(media.url);
    }

    const previewUrl = URL.createObjectURL(file);

    setMedia({
      file,
      url: previewUrl,
      type: isImage ? "image" : "video",
    });
  }

  function removeMedia() {
    if (media) {
      URL.revokeObjectURL(media.url);
    }

    setMedia(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function publishPost(event: FormEvent) {
    event.preventDefault();

    if (!caption.trim() && !title.trim() && !media) {
      alert("Add something to your post first.");
      return;
    }

    /*
      IMPORTANT:
      The selected file is currently a local browser preview.

      Permanent media upload will be connected in the next milestone.
      Therefore we only send mediaUrl when the user has an existing URL.
    */

    try {
      setPublishing(true);

      const response = await apiRequest<{ post: Post }>("/posts", {
        method: "POST",
        body: JSON.stringify({
          type: postType,
          title: title.trim() || undefined,
          caption: caption.trim() || undefined,
          category: category.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });

      const newPost = response.post;

      setPosts((current) => [newPost, ...current]);

      closeComposer();

      if (media) {
        alert(
          "Post published. Media upload will be connected in the next milestone."
        );
      }
    } catch (error) {
      console.error("Publish error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to publish post."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function toggleLike(postId: string) {
    try {
      await apiRequest(`/posts/${postId}/like`, {
        method: "POST",
      });

      await loadFeed();
    } catch (error) {
      console.error("Like error:", error);
    }
  }

  function sharePost(post: Post) {
    const username = post.author.profile?.username;

    const shareText = username
      ? `Check out @${username}'s post on CollabX`
      : `Check out this post on CollabX`;

    if (navigator.share) {
      navigator
        .share({
          title: "CollabX",
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        ?.writeText(window.location.href)
        .then(() => alert("Post link copied."));
    }
  }

  function openCollaboration(post: Post) {
    setCollaboratePost(post);
    setCollaborationMessage("");
  }

  function closeCollaboration() {
    if (sendingCollaboration) return;

    setCollaboratePost(null);
    setCollaborationMessage("");
  }

  async function sendCollaboration() {
    if (!collaboratePost) return;

    if (!collaborationMessage.trim()) {
      alert("Write a collaboration message.");
      return;
    }

    try {
      setSendingCollaboration(true);

      await apiRequest("/collaborations", {
        method: "POST",
        body: JSON.stringify({
          receiverId: collaboratePost.author.id,
          message: collaborationMessage.trim(),
        }),
      });

      alert("Collaboration request sent.");

      closeCollaboration();
    } catch (error) {
      console.error("Collaboration error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to send collaboration request."
      );
    } finally {
      setSendingCollaboration(false);
    }
  }

  function formatDate(date: string) {
    const value = new Date(date);

    return value.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] pb-20">
      <TopNav />

      <main className="mx-auto w-full max-w-2xl px-3 py-5 sm:px-5">
        {/* Composer */}
        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentUser?.profile?.avatarUrl || undefined}
              name={currentUser?.name || "You"}
              size="md"
            />

            <button
              onClick={openComposer}
              className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-left text-sm text-gray-500 transition hover:bg-gray-200"
            >
              What&apos;s happening?
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
            <button
              onClick={openComposer}
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              📷 Photo
            </button>

            <button
              onClick={openComposer}
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              🎥 Video
            </button>

            <button
              onClick={openComposer}
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              💼 Opportunity
            </button>
          </div>
        </section>

        {/* Feed */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading your feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <div className="mb-3 text-4xl">✨</div>

            <h2 className="text-lg font-semibold text-gray-900">
              Your feed is just getting started
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Share your first post and start building your CollabX presence.
            </p>

            <button
              onClick={openComposer}
              className="mt-5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Create your first post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const ownPost = currentUser?.id === post.author.id;

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={
                          post.author.profile?.avatarUrl || undefined
                        }
                        name={post.author.name}
                        size="md"
                      />

                      <div>
                        <div className="font-semibold text-gray-900">
                          {post.author.name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {post.author.profile?.username
                            ? `@${post.author.profile.username}`
                            : "CollabX user"}
                          {post.location
                            ? ` · ${post.location}`
                            : ""}
                          {" · "}
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    <button className="rounded-full px-2 py-1 text-xl text-gray-500 hover:bg-gray-100">
                      •••
                    </button>
                  </div>

                  {/* Post content */}
                  <div className="px-4 pb-3">
                    {post.type === "PORTFOLIO" && (
                      <span className="mb-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        Portfolio
                      </span>
                    )}

                    {post.type === "OPPORTUNITY" && (
                      <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Opportunity
                      </span>
                    )}

                    {post.category && (
                      <span className="mb-2 ml-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        {post.category}
                      </span>
                    )}

                    {post.title && (
                      <h2 className="text-base font-semibold text-gray-900">
                        {post.title}
                      </h2>
                    )}

                    {post.caption && (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {post.caption}
                      </p>
                    )}
                  </div>

                  {/* Existing server media */}
                  {post.mediaUrl && (
                    <div className="bg-gray-100">
                      {post.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="max-h-[650px] w-full object-contain"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.title || "CollabX post"}
                          className="max-h-[650px] w-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500">
                    <span>
                      ❤️ {post._count?.likes ?? 0} likes
                    </span>

                    <span>
                      {post._count?.comments ?? 0} comments
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 border-t border-gray-100">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      ❤️ Like
                    </button>

                    <button className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      💬 Comment
                    </button>

                    <button
                      onClick={() => sharePost(post)}
                      className="py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      ↗ Share
                    </button>

                    {!ownPost ? (
                      <button
                        onClick={() => openCollaboration(post)}
                        className="py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        🤝 Collaborate
                      </button>
                    ) : (
                      <button
                        disabled
                        className="cursor-default py-3 text-sm font-medium text-gray-300"
                      >
                        Your post
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />

      {/* CREATE POST MODAL */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
          <div className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <button
                onClick={closeComposer}
                className="text-sm font-medium text-gray-500"
              >
                Cancel
              </button>

              <h2 className="font-semibold text-gray-900">
                Create post
              </h2>

              <button
                onClick={publishPost}
                disabled={publishing}
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {publishing ? "Posting..." : "Post"}
              </button>
            </div>

            <form
              onSubmit={publishPost}
              className="overflow-y-auto p-5"
            >
              {/* User */}
              <div className="mb-5 flex items-center gap-3">
                <Avatar
                  src={currentUser?.profile?.avatarUrl || undefined}
                  name={currentUser?.name || "You"}
                  size="md"
                />

                <div>
                  <div className="font-semibold text-gray-900">
                    {currentUser?.name || "You"}
                  </div>

                  <div className="text-xs text-gray-500">
                    Posting to CollabX
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="mb-5 flex gap-2 overflow-x-auto">
                {[
                  ["UPDATE", "Post"],
                  ["PORTFOLIO", "Portfolio"],
                  ["OPPORTUNITY", "Opportunity"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setPostType(
                        value as
                          | "PORTFOLIO"
                          | "UPDATE"
                          | "OPPORTUNITY"
                      )
                    }
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                      postType === value
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Caption */}
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="What's happening?"
                rows={5}
                className="w-full resize-none border-none text-base outline-none placeholder:text-gray-400"
              />

              {/* Media preview */}
              {media ? (
                <div className="relative mt-3 overflow-hidden rounded-2xl bg-black">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt="Selected media preview"
                      className="max-h-[500px] w-full object-contain"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="max-h-[500px] w-full"
                    />
                  )}

                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-lg text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:bg-gray-100"
                >
                  <span className="text-4xl">📷</span>

                  <span className="mt-3 text-sm font-semibold text-gray-700">
                    Add photo or video
                  </span>

                  <span className="mt-1 text-xs text-gray-500">
                    Show people what you do
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaSelect}
              />

              {/* Extra fields */}
              <div className="mt-5 space-y-3">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={
                    postType === "OPPORTUNITY"
                      ? "Opportunity title"
                      : "Title (optional)"
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    placeholder="Category"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
                  />

                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="Location"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Bottom options */}
              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Add to your post
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      📷
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocation("")}
                      className="rounded-full bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      📍
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLABORATE MODAL */}
      {collaboratePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Collaborate with {collaboratePost.author.name}
              </h2>

              <button
                onClick={closeCollaboration}
                className="text-xl text-gray-400"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Start a conversation about this work.
            </p>

            <textarea
              value={collaborationMessage}
              onChange={(event) =>
                setCollaborationMessage(event.target.value)
              }
              placeholder="Hi, I'd like to collaborate with you..."
              rows={5}
              className="mt-5 w-full resize-none rounded-2xl border border-gray-200 p-4 text-sm outline-none focus:border-gray-400"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={closeCollaboration}
                className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={sendCollaboration}
                disabled={sendingCollaboration}
                className="flex-1 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sendingCollaboration
                  ? "Sending..."
                  : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}