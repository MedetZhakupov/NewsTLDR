import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found — CaptionCraft" };

  return {
    title: `${post.title} — CaptionCraft`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/blog"
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
        <article>
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
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
          </div>

          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none space-y-6">
            {post.content.map((section, i) => (
              <section key={i}>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {section.heading}
                </h2>
                {section.paragraphs.map((p, j) => (
                  <p
                    key={j}
                    className="text-sm text-slate-600 dark:text-slate-400"
                  >
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-gray-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Ready to generate captions in seconds?
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white rounded-xl px-6 py-3 font-semibold transition-all active:scale-[0.98] text-sm"
            >
              Try CaptionCraft free
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
