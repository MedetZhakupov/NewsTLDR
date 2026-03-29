import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — CaptionCraft",
  description:
    "Tips, guides, and strategies for creating engaging social media captions for Instagram, TikTok, LinkedIn, Twitter/X, and Facebook.",
  openGraph: {
    title: "Blog — CaptionCraft",
    description:
      "Tips and strategies for creating engaging social media captions.",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
            Blog
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="space-y-4">
          {/* CTA banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 border border-violet-200 dark:border-violet-800 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Generate captions for all 5 platforms in seconds.
            </p>
            <Link
              href="/"
              className="shrink-0 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white rounded-xl px-4 py-2 font-semibold transition-all text-sm"
            >
              Try free
            </Link>
          </div>

          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
            >
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {post.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {post.description}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <span>·</span>
                <span>{post.readingTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
