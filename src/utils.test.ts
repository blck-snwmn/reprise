import { describe, expect, it } from "vitest";
import { formatTime, parseTime } from "./utils";

describe("parseTime", () => {
  describe("mm:ss format", () => {
    it("parses 1:26 to 86 seconds", () => {
      expect(parseTime("1:26")).toBe(86);
    });

    it("parses 0:30 to 30 seconds", () => {
      expect(parseTime("0:30")).toBe(30);
    });

    it("parses 59:59 to 3599 seconds", () => {
      expect(parseTime("59:59")).toBe(3599);
    });

    it("parses 1:05 with leading zero", () => {
      expect(parseTime("1:05")).toBe(65);
    });
  });

  describe("h:mm:ss format", () => {
    it("parses 1:23:45 to 5025 seconds", () => {
      expect(parseTime("1:23:45")).toBe(5025);
    });

    it("parses 0:01:30 to 90 seconds", () => {
      expect(parseTime("0:01:30")).toBe(90);
    });

    it("parses 10:00:00 to 36000 seconds", () => {
      expect(parseTime("10:00:00")).toBe(36000);
    });
  });

  describe("edge cases", () => {
    it("returns NaN for empty string", () => {
      expect(parseTime("")).toBeNaN();
    });

    it("returns NaN for invalid format", () => {
      expect(parseTime("abc")).toBeNaN();
    });

    it("returns NaN for single number", () => {
      expect(parseTime("123")).toBeNaN();
    });

    it("returns NaN for too many colons", () => {
      expect(parseTime("1:2:3:4")).toBeNaN();
    });

    it("returns NaN for partial invalid", () => {
      expect(parseTime("1:ab")).toBeNaN();
    });
  });
});

describe("formatTime", () => {
  describe("under 1 hour", () => {
    it("formats 86 seconds to 1:26", () => {
      expect(formatTime(86)).toBe("1:26");
    });

    it("formats 0 to 0:00", () => {
      expect(formatTime(0)).toBe("0:00");
    });

    it("formats 59 to 0:59", () => {
      expect(formatTime(59)).toBe("0:59");
    });

    it("formats 65 to 1:05 with zero padding", () => {
      expect(formatTime(65)).toBe("1:05");
    });

    it("formats 3599 to 59:59", () => {
      expect(formatTime(3599)).toBe("59:59");
    });
  });

  describe("1 hour or more", () => {
    it("formats 5025 to 1:23:45", () => {
      expect(formatTime(5025)).toBe("1:23:45");
    });

    it("formats 3600 to 1:00:00", () => {
      expect(formatTime(3600)).toBe("1:00:00");
    });

    it("formats 36000 to 10:00:00", () => {
      expect(formatTime(36000)).toBe("10:00:00");
    });

    it("formats 3661 to 1:01:01", () => {
      expect(formatTime(3661)).toBe("1:01:01");
    });
  });

  describe("roundtrip", () => {
    it("parseTime(formatTime(x)) equals x for various values", () => {
      const values = [0, 30, 65, 86, 3599, 3600, 5025, 36000];
      for (const val of values) {
        expect(parseTime(formatTime(val))).toBe(val);
      }
    });
  });
});
