"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type CapabilityItem = {
  id?: string;
  capability?: {
    id?: string;
    capability?: string;
  };
};

type SkillItem = {
  id?: string;
  skill?: string;
};

type SocialLink = {
  id?: string;
  platform?: string;
  url?: string;
};

type Profile = {
  id: string;
  userId: string;
  username: string;
  bio?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  availability?: string | null;

  professionalTitle?: string | null;
  professionalHeadline?: string | null;
  professionalBio?: string | null;
  experienceLevel?: string | null;
  workPreference?: string | null;
  isAvailableForWork?: boolean;
  expectedSalary?: string | null;
  hourlyRate?: number | null;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;

  capabilities?: CapabilityItem[];
  skills?: SkillItem[];
  socialLinks?: SocialLink[];

  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

function formatLabel(value?: string | null) {
  if (!value) return "";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest<{
        success: boolean;
        profile?: Profile;
        message?: string;
      }>("/profile/me");

      console.log("PROFILE PAGE RESPONSE:", response);

      if (!response.success || !response.profile) {
        throw new Error(
          response.message || "Profile data was not returned."
        );
      }

      setProfile(response.profile);
    } catch (err) {
      console.error("Profile page loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load your profile"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mb-4 text-5xl">⚠️</div>

            <h1 className="text-2xl font-bold text-gray-900">
              Could not load your profile
            </h1>

            <p className="mt-2 text-gray-500">
              {error || "Profile data was not returned."}
            </p>

            <button
              onClick={loadProfile}
              className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const displayName =
    profile.user?.name || profile.username || "CollabX User";

  const capabilities =
    profile.capabilities
      ?.map((item) => item.capability?.capability)
      .filter(Boolean) || [];

  const skills =
    profile.skills
      ?.map((item) => item.skill)
      .filter(Boolean) || [];

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
              C
            </span>
            <span>CollabX</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="text-gray-600 hover:text-black"
            >
              Home
            </Link>

            <Link
              href="/discover"
              className="text-gray-600 hover:text-black"
            >
              Discover
            </Link>

            <Link
              href="/collaborations"
              className="text-gray-600 hover:text-black"
            >
              Collabs
            </Link>

            <Link
              href="/messages"
              className="text-gray-600 hover:text-black"
            >
              Messages
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Profile Header */}
        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="h-36 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500" />

          <div className="px-6 pb-6">
            <div className="-mt-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-black text-4xl font-bold text-white shadow-md">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="pb-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {displayName}
                  </h1>

                  <p className="text-gray-500">
                    @{profile.username}
                  </p>

                  {profile.location && (
                    <p className="mt-1 text-sm text-gray-500">
                      📍 {profile.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/profile/edit"
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  Edit Profile
                </Link>

                <Link
                  href="/discover"
                  className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Discover People
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Summary */}
        <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Professional Profile
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {profile.professionalTitle || "Add your professional title"}
              </h2>

              {profile.professionalHeadline && (
                <p className="mt-2 text-lg text-gray-600">
                  {profile.professionalHeadline}
                </p>
              )}
            </div>

            {profile.isAvailableForWork && (
              <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                ● Available for work
              </span>
            )}
          </div>

          {profile.professionalBio ? (
            <div className="mt-5">
              <h3 className="font-semibold text-gray-900">
                Professional Bio
              </h3>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-600">
                {profile.professionalBio}
              </p>
            </div>
          ) : profile.bio ? (
            <div className="mt-5">
              <h3 className="font-semibold text-gray-900">
                About
              </h3>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-600">
                {profile.bio}
              </p>
            </div>
          ) : null}
        </section>

        {/* Professional Details */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Professional Details
            </h2>

            <div className="mt-5 space-y-4">
              {profile.experienceLevel && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-500">
                    Experience Level
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatLabel(profile.experienceLevel)}
                  </span>
                </div>
              )}

              {profile.workPreference && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-500">
                    Work Preference
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatLabel(profile.workPreference)}
                  </span>
                </div>
              )}

              {profile.expectedSalary && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-500">
                    Expected Salary
                  </span>
                  <span className="font-semibold text-gray-900">
                    {profile.expectedSalary}
                  </span>
                </div>
              )}

              {profile.hourlyRate !== null &&
                profile.hourlyRate !== undefined && (
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-gray-500">
                      Hourly Rate
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{profile.hourlyRate}/hour
                    </span>
                  </div>
                )}

              {profile.availability && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Availability
                  </span>
                  <span className="font-semibold text-gray-900">
                    {profile.availability}
                  </span>
                </div>
              )}

              {!profile.experienceLevel &&
                !profile.workPreference &&
                !profile.expectedSalary &&
                profile.hourlyRate === null &&
                !profile.availability && (
                  <p className="text-gray-500">
                    Add professional details from Edit Profile.
                  </p>
                )}
            </div>
          </div>

          {/* Capabilities */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              What I Do
            </h2>

            {capabilities.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {capabilities.map((capability, index) => (
                  <span
                    key={`${capability}-${index}`}
                    className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
                  >
                    {formatLabel(capability)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-gray-500">
                No capabilities added yet.
              </p>
            )}
          </div>
        </section>

        {/* Skills */}
        <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Skills
          </h2>

          {skills.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-gray-500">
              No skills added yet.
            </p>
          )}
        </section>

        {/* Links */}
        <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Links and Portfolio
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                View Portfolio
              </a>
            )}

            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                View Resume
              </a>
            )}

            {profile.website && (
              <a
  href={
    profile.website?.startsWith("http")
      ? profile.website
      : `https://${profile.website}`
  }
  target="_blank"
  rel="noopener noreferrer"
>
  {profile.website}
</a>
            )}

            {profile.socialLinks?.map((link, index) =>
              link.url ? (
                <a
                  key={link.id || index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  {link.platform || "Social Link"}
                </a>
              ) : null
            )}

            {!profile.portfolioUrl &&
              !profile.resumeUrl &&
              !profile.website &&
              (!profile.socialLinks ||
                profile.socialLinks.length === 0) && (
                <p className="text-gray-500">
                  No external links added yet.
                </p>
              )}
          </div>
        </section>

        {/* Future Actions */}
        <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            CollabX Actions
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/discover"
              className="rounded-xl border p-4 text-center font-semibold hover:bg-gray-50"
            >
              Discover People
            </Link>

            <Link
              href="/collaborations"
              className="rounded-xl border p-4 text-center font-semibold hover:bg-gray-50"
            >
              My Collaborations
            </Link>

            <Link
              href="/profile/edit"
              className="rounded-xl border p-4 text-center font-semibold hover:bg-gray-50"
            >
              Update Profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}