import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_MP3_DURATION_SECONDS,
  normalizeBvid,
  parseVideoTarget,
  sanitizeMp3Filename,
  selectBestAudio,
} from "./bilibiliMp3";

test("normalizeBvid accepts canonical BV ids and rejects arbitrary input", () => {
  assert.equal(normalizeBvid("  BV1FPjy6TEiE "), "BV1FPjy6TEiE");
  assert.throws(() => normalizeBvid("https://example.com/video"), /BV 号/);
  assert.throws(() => normalizeBvid("BV123"), /BV 号/);
});

test("parseVideoTarget selects the first part and its duration", () => {
  const target = parseVideoTarget({
    code: 0,
    data: {
      bvid: "BV1FPjy6TEiE",
      title: "歌曲合集",
      pages: [
        { cid: 101, page: 1, part: "第一首歌", duration: 270 },
        { cid: 102, page: 2, part: "第二首歌", duration: 240 },
      ],
    },
  });

  assert.deepEqual(target, {
    bvid: "BV1FPjy6TEiE",
    cid: 101,
    title: "第一首歌",
    duration: 270,
    partCount: 2,
    isFirstPartOnly: true,
  });
});

test("parseVideoTarget rejects parts longer than ten minutes", () => {
  assert.throws(
    () =>
      parseVideoTarget({
        code: 0,
        data: {
          bvid: "BV1FPjy6TEiE",
          title: "超长视频",
          pages: [
            {
              cid: 101,
              page: 1,
              part: "超长视频",
              duration: MAX_MP3_DURATION_SECONDS + 1,
            },
          ],
        },
      }),
    /10 分钟/,
  );
});

test("selectBestAudio chooses the highest bandwidth https stream", () => {
  const audio = selectBestAudio({
    code: 0,
    data: {
      dash: {
        audio: [
          { id: 30216, bandwidth: 64_000, baseUrl: "https://a.example/64.m4s" },
          { id: 30280, bandwidth: 192_000, base_url: "https://a.example/192.m4s" },
          { id: 30232, bandwidth: 132_000, baseUrl: "http://a.example/132.m4s" },
        ],
      },
    },
  });

  assert.deepEqual(audio, {
    url: "https://a.example/192.m4s",
    bandwidth: 192_000,
  });
});

test("sanitizeMp3Filename removes reserved characters and remains usable", () => {
  assert.equal(
    sanitizeMp3Filename('  周杰伦:夜曲 / live?* <2026>  '),
    "周杰伦 夜曲 live 2026.mp3",
  );
  assert.equal(sanitizeMp3Filename("..."), "bilibili-audio.mp3");
});
