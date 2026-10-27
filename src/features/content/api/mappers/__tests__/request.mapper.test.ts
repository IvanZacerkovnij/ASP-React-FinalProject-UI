import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mapCreatePostRequest,
  mapUpdateRequest,
} from "../request.mapper";

const location = {
  id: "kyiv",
  name: "Kyiv",
  country: "Ukraine",
  latitude: 50.45,
  longitude: 30.52,
};

describe("API request mapping", () => {
  it("omits blank post content so ASP.NET StringLength accepts media-only posts", () => {
    const payload = mapCreatePostRequest({ content: "", mediaIds: ["attachment"] });
    expect(JSON.parse(JSON.stringify(payload))).toEqual({ mediaIds: ["attachment"] });
  });

  it("rejects textless comments and location-only posts before transport", () => {
    expect(() => mapCreatePostRequest({ content: "", postId: "post", mediaIds: ["attachment"] })).toThrow("текст коментаря");
    expect(() => mapCreatePostRequest({ content: "", mediaIds: [], location })).toThrow("Самої локації недостатньо");
  });
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T10:00:00Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("maps a composer poll to the backend endsAt contract", () => {
    expect(
      mapCreatePostRequest({
        content: "Hello",
        mediaIds: [],
        poll: { options: ["Так", "Ні"], duration: 60 },
      }),
    ).toMatchObject({
      poll: {
        options: ["Так", "Ні"],
        endsAt: "2026-10-09T11:00:00.000Z",
      },
    });
  });

  it("uses an explicit remove flag without restoring stale metadata", () => {
    const payload = mapUpdateRequest({
      content: "Updated",
      mediaIds: [],
      location: null,
    });

    expect(payload).toMatchObject({
      content: "Updated",
      mediaIds: [],
      removeLocation: true,
    });
    expect(payload).not.toHaveProperty("location");
  });

  it("rejects conflicting update commands before sending a request", () => {
    expect(() =>
      mapUpdateRequest({
        removeLocation: true,
        location,
      }),
    ).toThrow("одночасно оновити й видалити локацію");
  });
});
