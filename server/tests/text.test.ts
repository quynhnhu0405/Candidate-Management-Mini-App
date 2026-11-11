import { describe, expect, it } from "vitest";
import { ACCENT_FROM, ACCENT_TO, removeAccents } from "../src/shared/utils/text";

describe("removeAccents", () => {
  it.each([
    ["Quý", "Quy"],
    ["Nguyễn Văn Quỳnh", "Nguyen Van Quynh"],
    ["Đặng Thị Hương", "Dang Thi Huong"],
    ["đường", "duong"],
    ["plain ASCII 123", "plain ASCII 123"],
    ["", ""],
  ])("%s -> %s", (input, expected) => {
    expect(removeAccents(input)).toBe(expected);
  });

  it("also handles text typed with combining accent marks (NFD)", () => {
    expect(removeAccents("Quý".normalize("NFD"))).toBe("Quy");
  });
});

describe("ACCENT_FROM / ACCENT_TO (arguments for Postgres translate())", () => {
  it("have the same length, which translate() requires", () => {
    expect([...ACCENT_FROM]).toHaveLength([...ACCENT_TO].length);
  });

  it("map every accented letter, upper and lower case, to its plain lower-case letter", () => {
    const map = new Map([...ACCENT_FROM].map((char, i) => [char, [...ACCENT_TO][i]]));
    expect(map.get("ý")).toBe("y");
    expect(map.get("Ý")).toBe("y");
    expect(map.get("đ")).toBe("d");
    expect(map.get("Đ")).toBe("d");
    expect(map.get("ễ")).toBe("e");
  });
});
