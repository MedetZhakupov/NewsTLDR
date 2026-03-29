"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface Caption {
  platform: string;
  caption: string;
  charCount: number;
}

interface GenerationResult {
  captions: Caption[];
  summary: string;
}

const PLATFORM_CONFIG: Record<
  string,
  { icon: string; color: string; maxChars: number }
> = {
  Instagram: { icon: "📸", color: "from-pink-500 to-purple-500", maxChars: 2200 },
  LinkedIn: { icon: "💼", color: "from-blue-600 to-blue-800", maxChars: 3000 },
  TikTok: { icon: "🎵", color: "from-gray-900 to-black", maxChars: 2200 },
  "Twitter/X": { icon: "𝕏", color: "from-gray-800 to-black", maxChars: 280 },
  Facebook: { icon: "👥", color: "from-blue-500 to-blue-700", maxChars: 63206 },
};

const TONES = [
  { id: "casual", label: "Casual", icon: "💬" },
  { id: "professional", label: "Professional", icon: "💎" },
  { id: "witty", label: "Witty", icon: "😏" },
  { id: "bold", label: "Bold", icon: "🔥" },
  { id: "inspirational", label: "Inspirational", icon: "✨" },
];

const CREDIT_PACKAGES = [
  { id: "10_credits", credits: 10, price: 299, label: "10 credits", popular: false },
  { id: "50_credits", credits: 50, price: 999, label: "50 credits", popular: true },
  { id: "150_credits", credits: 150, price: 1999, label: "150 credits", popular: false },
];

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{ base64: string; mediaType: string } | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [tone, setTone] = useState("casual");
  const [totalGenerations, setTotalGenerations] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showSignInGate, setShowSignInGate] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const haptic = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleShare = async (platform: string, caption: string) => {
    haptic();
    if (navigator.share) {
      try {
        await navigator.share({ text: caption });
      } catch {
        // User cancelled share — not an error
      }
    } else {
      await navigator.clipboard.writeText(caption);
      showToast(`${platform} caption copied!`);
    }
  };

  // Fetch total generation count for social proof
  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setTotalGenerations(data.generations))
      .catch(() => {});
  }, []);

  // Fetch credits from server when signed in
  useEffect(() => {
    if (!isSignedIn) {
      setCredits(null);
      return;
    }
    fetch("/api/credits")
      .then((res) => res.json())
      .then((data) => setCredits(data.credits))
      .catch(() => setCredits(0));
  }, [isSignedIn, user]);

  // Auto-generate after sign-in if user had uploaded an image before signing in
  useEffect(() => {
    if (!isSignedIn) return;

    // Case 1: modal sign-in (component state survived)
    if (showSignInGate && imageFile) {
      setShowSignInGate(false);
      handleGenerate();
      return;
    }

    // Case 2: OAuth redirect (component state was lost, restore from sessionStorage)
    try {
      const pending = sessionStorage.getItem("pendingUpload");
      if (!pending) return;
      sessionStorage.removeItem("pendingUpload");
      const { dataUrl, base64, mediaType, tone: savedTone } = JSON.parse(pending);
      setImage(dataUrl);
      setImageFile({ base64, mediaType });
      if (savedTone) setTone(savedTone);
      setShowSignInGate(false);
    } catch {
      // Ignore parse errors
    }
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch referral code when signed in
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/referral")
      .then((res) => res.json())
      .then((data) => setReferralCode(data.code))
      .catch(() => {});
  }, [isSignedIn]);

  // Redeem referral code from URL param when user signs in
  useEffect(() => {
    if (!isSignedIn) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    window.history.replaceState({}, "", window.location.pathname);
    fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Referral bonus! +5 credits added");
          // Refresh credits
          fetch("/api/credits")
            .then((r) => r.json())
            .then((d) => setCredits(d.credits));
        }
      })
      .catch(() => {});
  }, [isSignedIn]);

  // Refresh credits after Stripe redirect (retry to allow webhook time to process)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased")) {
      window.history.replaceState({}, "", "/");

      const fetchCredits = () =>
        fetch("/api/credits")
          .then((res) => res.json())
          .then((data) => setCredits(data.credits));

      // Fetch immediately, then retry after 2s and 5s to catch webhook delay
      fetchCredits();
      setTimeout(fetchCredits, 2000);
      setTimeout(fetchCredits, 5000);
    }
    if (params.get("canceled")) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleBuyCredits = async (packageId: string) => {
    setCheckoutLoading(packageId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImage(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type as string;
      setImageFile({ base64, mediaType });
    };
    reader.readAsDataURL(file);
  }, []);

  // Listen for paste events globally (works on iOS via long-press → Paste)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (image) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [image, processFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleGenerate = async () => {
    if (!imageFile) return;
    if (!isSignedIn) {
      setShowSignInGate(true);
      // Persist upload to sessionStorage so it survives OAuth redirects
      try {
        sessionStorage.setItem(
          "pendingUpload",
          JSON.stringify({ dataUrl: image, base64: imageFile.base64, mediaType: imageFile.mediaType, tone })
        );
      } catch {
        // sessionStorage full or unavailable — non-critical
      }
      return;
    }
    if (credits !== null && credits <= 0) {
      setError("No credits remaining. Add more credits to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageFile.base64,
          mediaType: imageFile.mediaType,
          tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setResult({ captions: data.captions, summary: data.summary });
      if (data.credits !== undefined) setCredits(data.credits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (platform: string, index: number) => {
    if (!imageFile || regeneratingIndex !== null) return;

    setRegeneratingIndex(index);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageFile.base64,
          mediaType: imageFile.mediaType,
          platform,
          tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Regeneration failed");
      }

      const data = await res.json();
      setResult((prev) => {
        if (!prev) return prev;
        const updated = [...prev.captions];
        updated[index] = { platform: data.platform, caption: data.caption, charCount: data.charCount };
        return { ...prev, captions: updated };
      });
      showToast(`${platform} caption refreshed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    haptic();
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = async () => {
    if (!result) return;
    haptic();
    const allText = result.captions
      .map((c) => `--- ${c.platform} ---\n${c.caption}`)
      .join("\n\n");
    await navigator.clipboard.writeText(allText);
    showToast("All captions copied!");
  };

  const reset = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setShowSignInGate(false);
    try { sessionStorage.removeItem("pendingUpload"); } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-2.5 space-y-2">
          {/* Top row: Logo + User */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                CaptionCraft
              </span>
            </h1>
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-full px-4 py-2 font-medium transition-colors">
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
          {/* Bottom row: Credits + Actions (signed in only) */}
          {isSignedIn && (
            <div className="flex items-center gap-3">
              {credits !== null && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-gray-800 rounded-full px-3.5 py-1.5 text-sm font-medium">
                  <span className="text-amber-500">&#9733;</span>
                  <span>{credits} credits</span>
                </div>
              )}
              <div className="flex-1" />
              <Link
                href="/history"
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors px-2 py-1.5"
              >
                History
              </Link>
              <button
                onClick={() => setShowPricing(true)}
                className="text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-full px-4 py-1.5 font-medium transition-colors"
              >
                + Buy credits
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Sign-in prompt for unauthenticated users */}
        {!isSignedIn && (
          <div className="space-y-8">
            {/* Hero — above the fold */}
            <div className="mt-6 space-y-5 text-center">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                Screenshot to captions<br />in seconds
              </h2>
              <p className="text-base text-slate-500 max-w-sm mx-auto">
                Upload any image — get ready-to-post captions for Instagram, TikTok, LinkedIn, Twitter/X & Facebook.
              </p>
              <div className="space-y-2.5">
                <SignInButton mode="modal">
                  <button className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white rounded-xl px-8 py-4 font-semibold transition-all active:scale-[0.98] text-base">
                    Try free — no card required
                  </button>
                </SignInButton>
                <p className="text-xs text-slate-400">
                  5 free credits included
                  {totalGenerations !== null && totalGenerations > 0 && (
                    <span> · {totalGenerations.toLocaleString()}+ captions generated</span>
                  )}
                </p>
              </div>
            </div>

            {/* Sample Output — show the product */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 text-center">See it in action</p>
              <div className="rounded-xl border border-slate-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 flex items-center justify-between">
                  <span className="text-white font-medium text-sm flex items-center gap-2">
                    <span>📸</span> Instagram
                  </span>
                  <span className="text-white/70 text-xs">847/2200 chars</span>
                </div>
                <div className="p-4">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    Still can&apos;t believe this is real. ✨ From concept to launch in 30 days — proof that big dreams don&apos;t need big timelines. Drop a 🔥 if you&apos;re building something too.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">#buildinpublic #startup #launch</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                <div className="bg-gradient-to-r from-gray-800 to-black px-4 py-2 flex items-center justify-between">
                  <span className="text-white font-medium text-sm flex items-center gap-2">
                    <span>𝕏</span> Twitter/X
                  </span>
                  <span className="text-white/70 text-xs">128/280 chars</span>
                </div>
                <div className="p-4">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    30 days from idea to launch. No funding, no team, just shipping. Here&apos;s the screenshot to prove it.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center">+ LinkedIn, TikTok, and Facebook captions</p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              {[
                { n: "1", t: "Upload", d: "Any screenshot" },
                { n: "2", t: "Generate", d: "AI writes 5 captions" },
                { n: "3", t: "Post", d: "Copy & paste" },
              ].map((step) => (
                <div
                  key={step.n}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50"
                >
                  <div className="w-6 h-6 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-xs font-bold flex items-center justify-center mb-2">
                    {step.n}
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{step.t}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{step.d}</p>
                </div>
              ))}
            </div>

            {/* Try it now — upload area for unauth users */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 text-center">Or try it yourself</p>
            </div>
          </div>
        )}

        {/* Upload & Generation — available to all users */}
        <>
          {/* Upload Area */}
          {!image && !result ? (
            <>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragActive
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                    : "border-slate-300 dark:border-gray-700 hover:border-violet-400"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                  }}
                />
                <div className="space-y-4 cursor-pointer">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-violet-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                      Upload your screenshot
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Tap to browse or drag & drop — PNG, JPG, WebP up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              {/* Paste from clipboard */}
              <button
                onClick={async () => {
                  try {
                    const items = await navigator.clipboard.read();
                    // Try direct image blob first
                    for (const item of items) {
                      const imageType = item.types.find((t) => t.startsWith("image/"));
                      if (imageType) {
                        const blob = await item.getType(imageType);
                        const file = new File([blob], "pasted-image", { type: imageType });
                        processFile(file);
                        return;
                      }
                    }
                    // Try extracting image URL from HTML content (mobile browsers copy images as HTML)
                    for (const item of items) {
                      if (item.types.includes("text/html")) {
                        const htmlBlob = await item.getType("text/html");
                        const html = await htmlBlob.text();
                        const match = html.match(/<img[^>]+src="([^"]+)"/i);
                        if (match?.[1]) {
                          showToast("Loading image...");
                          const res = await fetch(match[1]);
                          const blob = await res.blob();
                          if (blob.type.startsWith("image/")) {
                            const file = new File([blob], "pasted-image", { type: blob.type });
                            processFile(file);
                            return;
                          }
                        }
                      }
                    }
                    showToast("No image found — try saving it to Photos first");
                  } catch {
                    showToast("Could not paste — try saving the image first, then upload");
                  }
                }}
                className="w-full mt-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Paste from clipboard
              </button>
            </>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Image Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image || undefined}
                  alt="Uploaded screenshot"
                  className="w-full max-h-72 object-contain"
                />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Tone Selector */}
              {!result && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tone</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                          tone === t.id
                            ? "bg-violet-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {!result && !showSignInGate && (
                <button
                  onClick={handleGenerate}
                  disabled={loading || (credits !== null && credits <= 0)}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Analyzing & Crafting...
                    </span>
                  ) : isSignedIn ? (
                    `Generate Captions (1 credit)`
                  ) : (
                    `Generate Captions — Free`
                  )}
                </button>
              )}

              {/* Loading Skeleton */}
              {loading && (
                <div className="mt-2 space-y-3">
                  {Object.entries(PLATFORM_CONFIG).map(([name, config]) => (
                    <div
                      key={name}
                      className="rounded-xl border border-slate-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900"
                    >
                      <div className={`bg-gradient-to-r ${config.color} px-4 py-2 flex items-center gap-2`}>
                        <span className="text-white text-sm">{config.icon}</span>
                        <span className="text-white font-medium text-sm">{name}</span>
                      </div>
                      <div className="p-4 space-y-2.5">
                        <div className="h-3.5 bg-slate-100 dark:bg-gray-800 rounded-full animate-pulse w-full" />
                        <div className="h-3.5 bg-slate-100 dark:bg-gray-800 rounded-full animate-pulse w-5/6" />
                        <div className="h-3.5 bg-slate-100 dark:bg-gray-800 rounded-full animate-pulse w-4/6" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Zero credits upsell — shown inline when user has no credits */}
          {isSignedIn && credits === 0 && !result && image && !loading && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30 border border-violet-200 dark:border-violet-800 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                You&apos;re out of credits!
              </p>
              <p className="text-xs text-slate-500">
                Add more credits to generate captions for this image.
              </p>
              <button
                onClick={() => setShowPricing(true)}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 transition-all active:scale-[0.98] text-sm"
              >
                Buy credits to continue
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 flex-1 mr-3">{result.summary}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={copyAll}
                    className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Copy all
                  </button>
                  <button
                    onClick={() => {
                      if (!result) return;
                      const body = result.captions
                        .map((c) => `--- ${c.platform} ---\n${c.caption}`)
                        .join("\n\n");
                      const subject = `My CaptionCraft captions: ${result.summary}`;
                      window.open(
                        `mailto:${user?.primaryEmailAddress?.emailAddress || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                        "_blank"
                      );
                    }}
                    className="text-sm text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </button>
                  <button
                    onClick={reset}
                    className="text-sm text-slate-400 hover:text-slate-600 font-medium"
                  >
                    New image
                  </button>
                </div>
              </div>

              {result.captions.map((cap, i) => {
                const config = PLATFORM_CONFIG[cap.platform];
                const isRegenerating = regeneratingIndex === i;
                return (
                  <div
                    key={cap.platform}
                    className="rounded-xl border border-slate-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div
                      className={`bg-gradient-to-r ${config?.color || "from-gray-500 to-gray-700"} px-4 py-2 flex items-center justify-between`}
                    >
                      <span className="text-white font-medium text-sm flex items-center gap-2">
                        <span>{config?.icon}</span>
                        {cap.platform}
                      </span>
                      <span className={`text-xs ${config?.maxChars && cap.charCount > config.maxChars ? "text-red-300 font-semibold" : "text-white/70"}`}>
                        {cap.charCount}
                        {config?.maxChars ? `/${config.maxChars}` : ""} chars
                        {config?.maxChars && cap.charCount > config.maxChars ? " ⚠" : ""}
                      </span>
                    </div>
                    <div className={`p-4 ${isRegenerating ? "opacity-50" : ""} transition-opacity`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {cap.caption}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <button
                          onClick={() => copyToClipboard(cap.caption, i)}
                          className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                        >
                          {copiedIndex === i ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleShare(cap.platform, cap.caption)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share
                        </button>
                        <button
                          onClick={() => handleRegenerate(cap.platform, i)}
                          disabled={isRegenerating || regeneratingIndex !== null}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                        >
                          <svg className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {isRegenerating ? "Refreshing..." : "Refresh"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Try different tone */}
              <div className="pt-3 border-t border-slate-200 dark:border-gray-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Try a different tone</p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTone(t.id);
                        setResult(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        tone === t.id
                          ? "bg-violet-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Selecting a new tone will let you re-generate (1 credit)</p>
              </div>

              {/* Low credits nudge */}
              {isSignedIn && credits !== null && credits > 0 && credits <= 2 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {credits === 1 ? "1 credit remaining" : `${credits} credits remaining`}
                  </p>
                  <button
                    onClick={() => setShowPricing(true)}
                    className="text-sm font-medium text-violet-600 hover:text-violet-700 whitespace-nowrap ml-3"
                  >
                    Buy more
                  </button>
                </div>
              )}

              {/* Referral share */}
              {isSignedIn && referralCode && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Love CaptionCraft? Share it & earn credits
                  </p>
                  <p className="text-xs text-slate-500">
                    Give a friend 5 free credits. You get 5 when they sign up.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400 truncate">
                      {`captioncraft.co/?ref=${referralCode}`}
                    </div>
                    <button
                      onClick={async () => {
                        const url = `${window.location.origin}/?ref=${referralCode}`;
                        await navigator.clipboard.writeText(url);
                        setReferralCopied(true);
                        showToast("Referral link copied!");
                        setTimeout(() => setReferralCopied(false), 2000);
                      }}
                      className="shrink-0 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
                    >
                      {referralCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state for signed-in users */}
          {isSignedIn && !image && (
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-5 gap-2 text-center">
                {Object.entries(PLATFORM_CONFIG).map(([name, config]) => (
                  <div key={name} className="space-y-1">
                    <div className="text-2xl">{config.icon}</div>
                    <p className="text-[10px] text-slate-400 font-medium">{name}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  One screenshot. Five platforms.
                </h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Upload any product screenshot, content, or moment — get
                  copy-paste captions tailored for each social platform in seconds.
                </p>
              </div>
            </div>
          )}

          {/* Sign-in gate — shown when unauth user tries to generate */}
          {showSignInGate && !isSignedIn && (
            <div className="mt-6 space-y-3 animate-fade-in">
              <div className="relative">
                {/* Blurred fake results */}
                <div className="space-y-3 select-none" aria-hidden="true">
                  {Object.entries(PLATFORM_CONFIG).map(([name, config]) => (
                    <div
                      key={name}
                      className="rounded-xl border border-slate-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 blur-[6px]"
                    >
                      <div className={`bg-gradient-to-r ${config.color} px-4 py-2 flex items-center gap-2`}>
                        <span className="text-white text-sm">{config.icon}</span>
                        <span className="text-white font-medium text-sm">{name}</span>
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Sign-in overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl text-center max-w-sm mx-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Your captions are ready!
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Sign in to reveal your 5 platform-optimized captions. You get 5 free credits — no card required.
                    </p>
                    <SignInButton mode="modal">
                      <button className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white rounded-xl px-6 py-3 font-semibold transition-all active:scale-[0.98] text-base">
                        Sign in to see captions
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center gap-4 text-xs text-slate-400">
        <Link href="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
      </footer>

      {/* Pricing Modal */}
      {showPricing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPricing(false);
          }}
        >
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Buy Credits
              </h2>
              <button
                onClick={() => setShowPricing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-500 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleBuyCredits(pkg.id)}
                  disabled={checkoutLoading !== null}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    pkg.popular
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                      : "border-slate-200 dark:border-gray-700 hover:border-violet-300"
                  } ${checkoutLoading === pkg.id ? "opacity-60" : ""}`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {pkg.credits} credits
                      </span>
                      {pkg.popular && (
                        <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full uppercase">
                          Best value
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      ${(pkg.price / 100 / pkg.credits).toFixed(2)} per caption
                    </span>
                  </div>
                  <div className="text-right">
                    {checkoutLoading === pkg.id ? (
                      <svg
                        className="w-5 h-5 animate-spin text-violet-600"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        ${(pkg.price / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Secure payment via Stripe. Credits never expire.
              {totalGenerations !== null && totalGenerations > 0 && (
                <span className="block mt-1">
                  {totalGenerations.toLocaleString()}+ captions generated by creators like you.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
