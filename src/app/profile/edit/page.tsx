"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Capability = {
  id: string;
  capability: string;
};

type Skill = {
  id: string;
  skill: string;
};

type SocialLink = {
  id?: string;
  platform: string;
  url: string;
};

type Profile = {
  username: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  website: string | null;
  availability: string | null;

  professionalTitle: string | null;
  professionalHeadline: string | null;
  professionalBio: string | null;
  experienceLevel: string | null;
  workPreference: string | null;
  isAvailableForWork: boolean;
  expectedSalary: string | null;
  hourlyRate: number | null;
  resumeUrl: string | null;
  portfolioUrl: string | null;

  capabilities: Array<{
    capability: Capability;
  }>;

  skills: Skill[];
  socialLinks: SocialLink[];
};

const CAPABILITIES = [
  "CREATOR",
  "PHOTOGRAPHER",
  "VIDEOGRAPHER",
  "EDITOR",
  "DESIGNER",
  "DEVELOPER",
  "FREELANCER",
  "BUSINESS_OWNER",
  "SERVICE_PROVIDER",
  "JOB_SEEKER",
  "SELLER",
  "RECRUITER",
  "AGENCY",
  "MARKETER",
  "WRITER",
  "ARTIST",
  "MODEL",
];

export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    bio: "",
    location: "",
    avatarUrl: "",
    website: "",
    availability: "",

    professionalTitle: "",
    professionalHeadline: "",
    professionalBio: "",
    experienceLevel: "",
    workPreference: "",
    isAvailableForWork: false,
    expectedSalary: "",
    hourlyRate: "",
    resumeUrl: "",
    portfolioUrl: "",

    capabilities: [] as string[],
    skills: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await apiRequest<{ success: boolean; profile: Profile }>(
          "/profile/me"
        );

        const profile = response.profile;

        setForm({
          username: profile.username || "",
          bio: profile.bio || "",
          location: profile.location || "",
          avatarUrl: profile.avatarUrl || "",
          website: profile.website || "",
          availability: profile.availability || "",

          professionalTitle: profile.professionalTitle || "",
          professionalHeadline: profile.professionalHeadline || "",
          professionalBio: profile.professionalBio || "",
          experienceLevel: profile.experienceLevel || "",
          workPreference: profile.workPreference || "",
          isAvailableForWork: profile.isAvailableForWork || false,
          expectedSalary: profile.expectedSalary || "",
          hourlyRate:
            profile.hourlyRate !== null && profile.hourlyRate !== undefined
              ? String(profile.hourlyRate)
              : "",
          resumeUrl: profile.resumeUrl || "",
          portfolioUrl: profile.portfolioUrl || "",

          capabilities:
            profile.capabilities?.map(
              (item) => item.capability.capability
            ) || [],

          skills: profile.skills?.map((item) => item.skill).join(", ") || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string | boolean | string[]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleCapability(capability: string) {
    setForm((previous) => {
      const exists = previous.capabilities.includes(capability);

      return {
        ...previous,
        capabilities: exists
          ? previous.capabilities.filter((item) => item !== capability)
          : [...previous.capabilities, capability],
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const skills = form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      await apiRequest("/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          username: form.username,
          bio: form.bio,
          location: form.location,
          avatarUrl: form.avatarUrl,
          website: form.website,
          availability: form.availability,

          professionalTitle: form.professionalTitle,
          professionalHeadline: form.professionalHeadline,
          professionalBio: form.professionalBio,
          experienceLevel: form.experienceLevel || null,
          workPreference: form.workPreference || null,
          isAvailableForWork: form.isAvailableForWork,
          expectedSalary: form.expectedSalary,
          hourlyRate: form.hourlyRate || null,
          resumeUrl: form.resumeUrl,
          portfolioUrl: form.portfolioUrl,

          capabilities: form.capabilities,
          skills,
        }),
      });

      setMessage("Profile updated successfully");

      setTimeout(() => {
        router.push("/profile");
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-400">COLLABX</p>
            <h1 className="mt-1 text-3xl font-bold">
              Professional Profile
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Tell people what you do, what you offer, and what opportunities
              you are looking for.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Username"
                value={form.username}
                onChange={(value) => updateField("username", value)}
              />

              <Field
                label="Location"
                value={form.location}
                onChange={(value) => updateField("location", value)}
                placeholder="Guwahati, Assam"
              />

              <Field
                label="Avatar URL"
                value={form.avatarUrl}
                onChange={(value) => updateField("avatarUrl", value)}
              />

              <Field
                label="Website"
                value={form.website}
                onChange={(value) => updateField("website", value)}
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Short Bio"
                  value={form.bio}
                  onChange={(value) => updateField("bio", value)}
                  placeholder="A short introduction about yourself"
                />
              </div>

              <Field
                label="Availability"
                value={form.availability}
                onChange={(value) => updateField("availability", value)}
                placeholder="Available weekdays, evenings, etc."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-1 text-xl font-semibold">
              Professional Information
            </h2>

            <p className="mb-5 text-sm text-slate-400">
              This information helps CollabX recommend you to relevant people,
              businesses, clients, and recruiters.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Professional Title"
                value={form.professionalTitle}
                onChange={(value) =>
                  updateField("professionalTitle", value)
                }
                placeholder="Full-Stack Developer"
              />

              <Field
                label="Professional Headline"
                value={form.professionalHeadline}
                onChange={(value) =>
                  updateField("professionalHeadline", value)
                }
                placeholder="Building modern web applications"
              />

              <SelectField
                label="Experience Level"
                value={form.experienceLevel}
                onChange={(value) =>
                  updateField("experienceLevel", value)
                }
                options={[
                  ["BEGINNER", "Beginner"],
                  ["ENTRY_LEVEL", "Entry Level"],
                  ["MID_LEVEL", "Mid Level"],
                  ["SENIOR", "Senior"],
                  ["EXPERT", "Expert"],
                ]}
              />

              <SelectField
                label="Work Preference"
                value={form.workPreference}
                onChange={(value) =>
                  updateField("workPreference", value)
                }
                options={[
                  ["REMOTE", "Remote"],
                  ["HYBRID", "Hybrid"],
                  ["ONSITE", "On-site"],
                  ["FLEXIBLE", "Flexible"],
                ]}
              />

              <Field
                label="Expected Salary"
                value={form.expectedSalary}
                onChange={(value) =>
                  updateField("expectedSalary", value)
                }
                placeholder="₹6 LPA or Negotiable"
              />

              <Field
                label="Hourly Rate"
                value={form.hourlyRate}
                onChange={(value) => updateField("hourlyRate", value)}
                placeholder="500"
                type="number"
              />

              <Field
                label="Resume URL"
                value={form.resumeUrl}
                onChange={(value) => updateField("resumeUrl", value)}
              />

              <Field
                label="Portfolio URL"
                value={form.portfolioUrl}
                onChange={(value) =>
                  updateField("portfolioUrl", value)
                }
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Professional Bio"
                  value={form.professionalBio}
                  onChange={(value) =>
                    updateField("professionalBio", value)
                  }
                  placeholder="Explain your experience, strengths, services, and the type of work you want."
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isAvailableForWork}
                  onChange={(event) =>
                    updateField(
                      "isAvailableForWork",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 rounded border-slate-700 bg-slate-800"
                />

                <span>
                  <span className="block font-medium">
                    Available for work
                  </span>
                  <span className="block text-sm text-slate-400">
                    Let businesses and recruiters know that you are open to
                    opportunities.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-2 text-xl font-semibold">Capabilities</h2>

            <p className="mb-4 text-sm text-slate-400">
              Select everything you can do. You can have multiple identities
              on CollabX.
            </p>

            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map((capability) => {
                const selected = form.capabilities.includes(capability);

                return (
                  <button
                    key={capability}
                    type="button"
                    onClick={() => toggleCapability(capability)}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-cyan-400 bg-cyan-400/15 text-cyan-300"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {capability.replaceAll("_", " ")}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-2 text-xl font-semibold">Skills</h2>

            <p className="mb-4 text-sm text-slate-400">
              Separate skills with commas.
            </p>

            <TextArea
              label="Skills"
              value={form.skills}
              onChange={(value) => updateField("skills", value)}
              placeholder="React, Node.js, TypeScript, MongoDB, UI Design"
            />
          </section>

          {message && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Professional Profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
      >
        <option value="">Select</option>

        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}