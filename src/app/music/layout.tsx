import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "声浪搜歌｜Bilibili 音乐搜索",
  description: "按关键词搜索 Bilibili 音乐视频，每次展示 12 条结果。",
};

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
