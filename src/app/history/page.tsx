"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface Caption {
  platform: string;
  caption: string;
  charCount: number;
}

interface HistoryItem {
  id: string;
  summary: string;
  captions: Caption[];
  createdAt: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: "📸",
  LinkedIn: "💼",
  TikTok: "🎵",
  "Twitter/X": "𝕏",
  Facebook: "👥",
};

export default function HistoryPage() {
  const { isSignedIn } = useUser();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?limit=${limit}&offset=${offset}`);
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    if (isSignedIn) fetchHistory();
  }, [isSignedIn, fetchHistory]);

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // silently fail
    }
  };

  const copyCaption = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
              History
            </h1>
          </div>
          <span className="text-sm text-slate-400">
            {total} generation{total !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-6 h-6 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No generations yet</p>
            <Link
              href="/"
              className="inline-block text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Create your first caption
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                >
                  {/* Collapsed row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex -space-x-1 shrink-0">
                      {item.captions.slice(0, 3).map((c) => (
                        <span key={c.platform} className="text-sm">
                          {PLATFORM_ICONS[c.platform] || "💬"}
                        </span>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {item.summary}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(item.createdAt)} · {item.captions.length} captions
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded captions */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-gray-800 animate-fade-in">
                      {item.captions.map((cap) => {
                        const copyKey = `${item.id}-${cap.platform}`;
                        return (
                          <div
                            key={cap.platform}
                            className="px-4 py-3 border-b border-slate-50 dark:border-gray-800/50 last:border-b-0"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                <span>{PLATFORM_ICONS[cap.platform] || "💬"}</span>
                                {cap.platform}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyCaption(cap.caption, copyKey);
                                }}
                                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                              >
                                {copiedKey === copyKey ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                              {cap.caption}
                            </p>
                          </div>
                        );
                      })}
                      <div className="px-4 py-2 bg-slate-50 dark:bg-gray-800/30 flex justify-end">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* CTA to generate more */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 border border-violet-200 dark:border-violet-800 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ready for more captions?
              </p>
              <Link
                href="/"
                className="inline-block bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white rounded-xl px-6 py-2.5 font-semibold transition-all active:scale-[0.98] text-sm"
              >
                Generate new captions
              </Link>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                  disabled={offset === 0}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setOffset((o) => o + limit)}
                  disabled={currentPage >= totalPages}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
