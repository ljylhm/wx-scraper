"use client";

import {
  ArrowDown,
  Disc3,
  Download,
  ExternalLink,
  Headphones,
  LoaderCircle,
  Music2,
  Play,
  Search,
  Sparkles,
  Waves,
} from "lucide-react";
import { FormEvent, useState } from "react";

import type { BilibiliSearchResult, BilibiliVideo } from "@/lib/bilibili";

import "./music.css";

interface SearchApiResponse extends BilibiliSearchResult {
  success: true;
  keyword: string;
}

interface SearchApiError {
  success: false;
  error?: string;
}

function formatViews(views: number): string {
  if (views >= 100_000_000) return `${(views / 100_000_000).toFixed(1)}亿`;
  if (views >= 10_000) return `${(views / 10_000).toFixed(1)}万`;
  return views.toLocaleString("zh-CN");
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp * 1_000));
}

function VideoCard({ video, index }: { video: BilibiliVideo; index: number }) {
  return (
    <article className="music-card" style={{ "--card-index": index } as React.CSSProperties}>
      <div className="music-card-cover">
        {/* Bilibili covers come from several numbered CDN hosts, so a native image is used here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.cover}
          alt={`${video.title}封面`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <span className="music-card-duration">{video.duration}</span>
        <span className="music-card-play" aria-hidden="true">
          <Play size={16} fill="currentColor" />
        </span>
      </div>

      <div className="music-card-body">
        <div className="music-card-labels">
          <span>{video.category}</span>
          <span>{formatViews(video.views)} 播放</span>
        </div>
        <h2>{video.title}</h2>
        <div className="music-card-meta">
          <span>{video.author}</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
        <div className="music-card-actions">
          <a href={video.url} target="_blank" rel="noreferrer">
            前往 Bilibili
            <ExternalLink size={15} />
          </a>
          <button type="button" disabled title="MP3 转换将在下一阶段开放">
            <Download size={15} />
            转换 MP3
            <small>即将开放</small>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MusicSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [activeKeyword, setActiveKeyword] = useState("");
  const [videos, setVideos] = useState<BilibiliVideo[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  async function fetchResults(
    query: string,
    nextPage: number,
    append: boolean,
  ) {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        keyword: query,
        page: String(nextPage),
        pageSize: "12",
      });
      const response = await fetch(`/api/bilibili/search?${params.toString()}`);
      const payload = (await response.json()) as SearchApiResponse | SearchApiError;

      if (!response.ok || !payload.success) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "搜索暂时不可用，请稍后重试",
        );
      }

      setVideos((current) =>
        append ? [...current, ...payload.items] : payload.items,
      );
      setPage(payload.page);
      setTotal(payload.total);
      setHasMore(payload.hasMore);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "搜索暂时不可用，请稍后重试",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = keyword.trim();

    if (!query) {
      setError("先输入一首歌、歌手或音乐关键词");
      return;
    }

    setHasSearched(true);
    setActiveKeyword(query);
    setVideos([]);
    setPage(0);
    setTotal(0);
    setHasMore(false);
    void fetchResults(query, 1, false);
  }

  function handleLoadMore() {
    if (!activeKeyword || loadingMore || !hasMore) return;
    void fetchResults(activeKeyword, page + 1, true);
  }

  const showEmpty = hasSearched && !loading && !error && videos.length === 0;

  return (
    <main className="music-page">
      <div className="music-noise" aria-hidden="true" />
      <header className="music-nav">
        <a className="music-brand" href="/music" aria-label="声浪搜歌首页">
          <span><Waves size={20} /></span>
          声浪搜歌
        </a>
        <div className="music-nav-status">
          <i /> BILIBILI VIDEO SEARCH
        </div>
      </header>

      <section className="music-hero">
        <div className="music-hero-copy">
          <p className="music-eyebrow"><Sparkles size={15} /> FIND YOUR FREQUENCY</p>
          <h1>
            搜到旋律，
            <span>留下声音。</span>
          </h1>
          <p className="music-intro">
            输入歌曲、歌手或现场关键词，从 Bilibili 视频中寻找你想听的内容。
            每次展示 12 条，慢慢挑，不刷屏。
          </p>

          <form className="music-search" onSubmit={handleSubmit}>
            <label htmlFor="music-keyword">搜索音乐</label>
            <div className="music-search-box">
              <Search aria-hidden="true" size={23} />
              <input
                id="music-keyword"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="试试：周杰伦 夜曲、落日飞车 live..."
                maxLength={80}
                autoComplete="off"
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? <LoaderCircle className="music-spin" size={19} /> : <Search size={19} />}
                {loading ? "搜索中" : "开始搜索"}
              </button>
            </div>
          </form>

          <div className="music-hints" aria-label="搜索特点">
            <span><Disc3 size={15} /> 视频结果</span>
            <span><Music2 size={15} /> 每页 12 条</span>
            <span><Headphones size={15} /> MP3 功能预留</span>
          </div>
        </div>

        <div className="music-visual" aria-hidden="true">
          <div className="music-orbit music-orbit-one" />
          <div className="music-orbit music-orbit-two" />
          <div className="music-record">
            <span className="music-record-ring" />
            <span className="music-record-label"><Music2 size={32} /></span>
          </div>
          <div className="music-equalizer">
            {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
          </div>
          <span className="music-visual-note">SEARCH · LISTEN · SAVE</span>
        </div>
      </section>

      <section className="music-results" aria-live="polite">
        {error && (
          <div className="music-message music-message-error">
            <span>!</span>
            <div><strong>这次没有接上信号</strong><p>{error}</p></div>
            {activeKeyword && (
              <button type="button" onClick={() => void fetchResults(activeKeyword, 1, false)}>
                重新搜索
              </button>
            )}
          </div>
        )}

        {!hasSearched && !error && (
          <div className="music-empty music-empty-initial">
            <Disc3 size={42} strokeWidth={1.3} />
            <p>搜索结果会出现在这里</p>
            <span>关键词越具体，越容易找到正确版本</span>
          </div>
        )}

        {loading && (
          <div className="music-loading">
            <div className="music-loading-disc"><Disc3 size={40} /></div>
            <p>正在翻找 Bilibili 的曲库...</p>
          </div>
        )}

        {showEmpty && (
          <div className="music-empty">
            <Search size={38} strokeWidth={1.4} />
            <p>没有找到“{activeKeyword}”</p>
            <span>换一个歌名、歌手，或减少限定词再试试</span>
          </div>
        )}

        {videos.length > 0 && (
          <>
            <div className="music-results-heading">
              <div>
                <p>SEARCH RESULTS</p>
                <h2>“{activeKeyword}”</h2>
              </div>
              <span>找到约 {total.toLocaleString("zh-CN")} 个视频 · 已展示 {videos.length} 个</span>
            </div>
            <div className="music-grid">
              {videos.map((video, index) => (
                <VideoCard key={`${video.bvid}-${index}`} video={video} index={index % 12} />
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                className="music-load-more"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? <LoaderCircle className="music-spin" size={18} /> : <ArrowDown size={18} />}
                {loadingMore ? "正在加载" : "再看 12 条"}
              </button>
            )}
          </>
        )}
      </section>

      <footer className="music-footer">
        <span>仅用于搜索与发现，请尊重创作者权益</span>
        <span>PHASE 01 / SEARCH</span>
      </footer>
    </main>
  );
}
