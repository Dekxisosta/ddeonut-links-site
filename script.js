// ---------- Mobile menu ----------
const hamburger = document.getElementById("hamburger");
const nav = document.getElementById("nav");

function setMenu(open) {
  nav.classList.toggle("active", open);
  hamburger.setAttribute("aria-expanded", String(open));
}

hamburger.addEventListener("click", () => setMenu(!nav.classList.contains("active")));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// Inactive social links shouldn't jump the page
document.querySelectorAll(".is-inactive").forEach((a) =>
  a.addEventListener("click", (e) => e.preventDefault())
);

// ---------- Pinned YouTube videos (optional) ----------
// The main player above auto-loads the channel's latest uploads.
// To also show specific videos as a grid, paste their IDs here, e.g.
//   const VIDEOS = ["dQw4w9WgXcQ", "abc123XYZ_-"];
// (the ID is the part after "v=" in a youtube.com/watch URL)
const VIDEOS = [];

const grid = document.getElementById("video-grid");

VIDEOS.forEach((id) => {
  const card = document.createElement("button");
  card.className = "video-card";
  card.type = "button";
  card.setAttribute("aria-label", "Play video");
  card.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
  card.innerHTML = '<span class="play" aria-hidden="true">▶</span>';

  // Click-to-load: no YouTube iframe is fetched until the user asks for it
  card.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    frame.title = "YouTube video player";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    card.replaceChildren(frame);
  }, { once: true });

  grid.appendChild(card);
});

if (VIDEOS.length) grid.hidden = false;

// ---------- Active tab highlight ----------
const tabs = [...document.querySelectorAll("a.post-tab")];
const sections = tabs.map((t) => document.querySelector(t.getAttribute("href")));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    tabs.forEach((t) => t.classList.toggle("is-active", t.getAttribute("href") === "#" + entry.target.id));
  });
}, { rootMargin: "-30% 0px -60% 0px" });

sections.forEach((s) => s && observer.observe(s));

// ---------- Live subscriber count ----------
// 1. Google Cloud Console -> enable "YouTube Data API v3" -> create an API key.
// 2. Restrict the key to your site's domain (HTTP referrers) so it can't be abused.
// 3. Paste it below. Until then the subscriber pill stays hidden.
const YT_API_KEY = "";
const YT_CHANNEL_ID = "UCb0_5BrT-SJqLAt9lJTaEHw";

async function loadSubscribers() {
  if (!YT_API_KEY) return;
  const box = document.getElementById("subs");
  const out = document.getElementById("subs-count");
  const cacheKey = "minchie-subs";

  const show = (n) => {
    out.textContent = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
    box.hidden = false;
  };

  // Show last known value instantly, then refresh (saves API quota too)
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached) show(cached.n);
    if (cached && Date.now() - cached.t < 6 * 3600 * 1000) return;
  } catch (_) {}

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YT_CHANNEL_ID}&key=${YT_API_KEY}`
    );
    if (!res.ok) throw new Error(res.status);
    const stats = (await res.json()).items?.[0]?.statistics;
    if (!stats || stats.hiddenSubscriberCount) return; // channel hides its count
    const n = Number(stats.subscriberCount);
    show(n);
    try { localStorage.setItem(cacheKey, JSON.stringify({ n, t: Date.now() })); } catch (_) {}
  } catch (_) { /* keep whatever is shown; fail silently */ }
}

loadSubscribers();
