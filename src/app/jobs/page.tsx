"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Job = {
  id: string;
  externalId: string;
  source: string;
  title: string;
  companyName: string;
  companyLogo?: string | null;
  location?: string | null;
  remote: boolean;
  jobType?: string | null;
  category?: string | null;
  salary?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  applicationUrl: string;
  sourceUrl: string;
  tags: string[];
};

type JobsResponse = {
  success: boolean;
  source: string;
  count: number;
  jobs: Job[];
};

function formatDate(date?: string | null) {
  if (!date) return "Recently posted";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently posted";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatJobType(type?: string | null) {
  if (!type) return "Not specified";

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(companyName: string) {
  return companyName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function stripHtml(html?: string | null) {
  if (!html) return "No description available.";

  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [activeTab, setActiveTab] = useState<"latest" | "remote">(
    "latest"
  );

  const loadJobs = useCallback(
    async (searchTerm = "", tab = activeTab) => {
      try {
        setError("");

        if (searchTerm || tab === "remote") {
          setSearching(true);
        } else {
          setLoading(true);
        }

        let endpoint = "";

        if (searchTerm.trim()) {
          endpoint = `/jobs/search?search=${encodeURIComponent(
            searchTerm.trim()
          )}&limit=100`;
        } else if (tab === "remote") {
          endpoint = "/jobs/remote";
        } else {
          endpoint = "/jobs/latest?limit=100";
        }

        const response = await apiRequest<JobsResponse>(endpoint);

        setJobs(response.jobs || []);
        setSource(response.source || "External Jobs");
      } catch (err) {
        console.error("Jobs loading error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load jobs right now"
        );
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    loadJobs("", "latest");
  }, [loadJobs]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();

    const term = search.trim();
    setActiveSearch(term);
    loadJobs(term, activeTab);
  }

  function changeTab(tab: "latest" | "remote") {
    setActiveTab(tab);
    setActiveSearch("");
    setSearch("");
    loadJobs("", tab);
  }

  function clearSearch() {
    setSearch("");
    setActiveSearch("");
    loadJobs("", activeTab);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              ConnectAS Opportunities
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Discover your next opportunity
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Search remote jobs, explore companies, and find opportunities
              from multiple job sources in one place.
            </p>
          </div>

          {/* Search */}
          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm md:flex-row"
          >
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4">
              <span className="mr-3 text-lg">🔎</span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search React, Node.js, Python, designer..."
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-slate-950 px-7 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {searching ? "Searching..." : "Search Jobs"}
            </button>

            {activeSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tabs and stats */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              onClick={() => changeTab("latest")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === "latest"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Latest Jobs
            </button>

            <button
              onClick={() => changeTab("remote")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === "remote"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Remote Jobs
            </button>
          </div>

          <div className="text-sm text-slate-500">
            {loading || searching ? (
              "Loading opportunities..."
            ) : (
              <>
                <span className="font-bold text-slate-900">
                  {jobs.length}
                </span>{" "}
                jobs found
                {source && (
                  <span className="ml-2">
                    • Powered by {source}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search status */}
        {activeSearch && !loading && (
          <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            Showing results for{" "}
            <strong>&quot;{activeSearch}&quot;</strong>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-bold">Unable to load jobs</p>
            <p className="mt-1">{error}</p>

            <button
              onClick={() => loadJobs(activeSearch, activeTab)}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex gap-4">
                  <div className="h-14 w-14 rounded-xl bg-slate-200" />

                  <div className="flex-1">
                    <div className="h-5 w-3/4 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Jobs */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="text-5xl">🧭</div>

                <h2 className="mt-4 text-xl font-black text-slate-900">
                  No jobs found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Try another keyword or browse the latest opportunities.
                </p>

                <button
                  onClick={clearSearch}
                  className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
                >
                  Browse Latest Jobs
                </button>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {jobs.map((job) => (
                  <article
                    key={job.id}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                  >
                    <div className="flex gap-4">
                      {/* Company logo */}
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.companyName}
                          className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-contain p-1"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">
                          {getInitials(job.companyName)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h2 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
                              {job.title}
                            </h2>

                            <p className="mt-1 text-sm font-semibold text-slate-600">
                              {job.companyName}
                            </p>
                          </div>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {job.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                        📍 {job.location || "Remote"}
                      </span>

                      {job.remote && (
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          🌍 Remote
                        </span>
                      )}

                      {job.jobType && (
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          💼 {formatJobType(job.jobType)}
                        </span>
                      )}

                      {job.category && (
                        <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                          🏷️ {job.category}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {stripHtml(job.description)}
                    </p>

                    {/* Salary and date */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        {job.salary ? (
                          <p className="text-sm font-bold text-emerald-700">
                            💰 {job.salary}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Salary not specified
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        Posted {formatDate(job.publishedAt)}
                      </p>
                    </div>

                    {/* Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {job.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        External opportunity
                      </span>

                      <a
                        href={job.applicationUrl || job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        Apply Now ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* Attribution */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
          Jobs are sourced from external providers. Apply through the original
          job listing.
        </div>
      </div>
    </main>
  );
}