import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSearchResponse,
  parseSearchParams,
} from "./bilibili";

test("parseSearchParams applies defaults and trims the keyword", () => {
  assert.deepEqual(
    parseSearchParams(new URLSearchParams({ keyword: "  周杰伦  " })),
    { keyword: "周杰伦", page: 1, pageSize: 12 },
  );
});

test("parseSearchParams caps page size and rejects invalid input", () => {
  assert.deepEqual(
    parseSearchParams(
      new URLSearchParams({ keyword: "钢琴", page: "2", pageSize: "99" }),
    ),
    { keyword: "钢琴", page: 2, pageSize: 20 },
  );

  assert.throws(
    () => parseSearchParams(new URLSearchParams({ keyword: "" })),
    /请输入音乐关键词/,
  );
  assert.throws(
    () =>
      parseSearchParams(
        new URLSearchParams({ keyword: "a".repeat(81) }),
      ),
    /80 个字符/,
  );
});

test("normalizeSearchResponse cleans and filters upstream records", () => {
  const result = normalizeSearchResponse(
    {
      code: 0,
      message: "OK",
      data: {
        numResults: 34,
        numPages: 3,
        result: [
          {
            bvid: "BV1example",
            title: '夜曲 <em class="keyword">周杰伦</em>',
            author: "音乐收藏家",
            pic: "//i0.hdslb.com/example.jpg",
            duration: "3:47",
            play: 123456,
            pubdate: 1_723_456_789,
            typename: "音乐综合",
          },
          {
            bvid: "",
            title: "缺少 BV 号",
          },
        ],
      },
    },
    1,
    12,
  );

  assert.equal(result.items.length, 1);
  assert.deepEqual(result.items[0], {
    bvid: "BV1example",
    title: "夜曲 周杰伦",
    author: "音乐收藏家",
    cover: "https://i0.hdslb.com/example.jpg",
    duration: "3:47",
    views: 123456,
    publishedAt: 1_723_456_789,
    category: "音乐综合",
    url: "https://www.bilibili.com/video/BV1example",
  });
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 12);
  assert.equal(result.total, 34);
  assert.equal(result.totalPages, 3);
  assert.equal(result.hasMore, true);
});

test("normalizeSearchResponse rejects unsuccessful upstream data", () => {
  assert.throws(
    () => normalizeSearchResponse({ code: -412, message: "请求被拦截" }, 1, 12),
    /请求被拦截/,
  );
});
