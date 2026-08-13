import assert from "node:assert/strict";
import test from "node:test";

import { isMobileNavigator, supportsMobileFileShare } from "./mobileFileShare";

test("isMobileNavigator detects mobile user agents and touch iPad", () => {
  assert.equal(
    isMobileNavigator({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)", maxTouchPoints: 5, platform: "iPhone" }),
    true,
  );
  assert.equal(
    isMobileNavigator({ userAgent: "Mozilla/5.0 (Linux; Android 15)", maxTouchPoints: 5, platform: "Linux armv8l" }),
    true,
  );
  assert.equal(
    isMobileNavigator({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)", maxTouchPoints: 5, platform: "MacIntel" }),
    true,
  );
  assert.equal(
    isMobileNavigator({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)", maxTouchPoints: 0, platform: "MacIntel" }),
    false,
  );
});

test("isMobileNavigator detects touch HarmonyOS and OpenHarmony devices", () => {
  assert.equal(
    isMobileNavigator({
      userAgent: "Mozilla/5.0 (Phone; OpenHarmony 5.0) AppleWebKit/537.36 ArkWeb/4.1 HuaweiBrowser/5.0",
      maxTouchPoints: 5,
      platform: "Linux armv8l",
    }),
    true,
  );
  assert.equal(
    isMobileNavigator({
      userAgent: "Mozilla/5.0 (HarmonyOS 5.0) AppleWebKit/537.36 ArkWeb/4.1",
      maxTouchPoints: 0,
      platform: "Linux x86_64",
    }),
    false,
  );
});

test("supportsMobileFileShare requires mobile detection and canShare approval", () => {
  const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });
  assert.equal(
    supportsMobileFileShare(
      { userAgent: "Android", maxTouchPoints: 5, platform: "Linux", canShare: () => true },
      file,
    ),
    true,
  );
  assert.equal(
    supportsMobileFileShare(
      { userAgent: "Desktop", maxTouchPoints: 0, platform: "MacIntel", canShare: () => true },
      file,
    ),
    false,
  );
  assert.equal(
    supportsMobileFileShare(
      { userAgent: "Android", maxTouchPoints: 5, platform: "Linux", canShare: () => false },
      file,
    ),
    false,
  );
});
