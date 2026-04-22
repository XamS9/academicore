import { describe, expect, it } from "vitest";
import { MarkTopicProgressDto } from "./syllabus.dto";

describe("syllabus DTOs (course syllabus / instructor progress payloads)", () => {
  it("accepts valid mark-progress payload", () => {
    const dto = MarkTopicProgressDto.parse({
      topicId: "550e8400-e29b-41d4-a716-446655440000",
      weekNumber: 3,
      notes: "Cubierto en laboratorio",
    });
    expect(dto.weekNumber).toBe(3);
  });

  it("rejects weekNumber out of range", () => {
    expect(() =>
      MarkTopicProgressDto.parse({
        topicId: "550e8400-e29b-41d4-a716-446655440000",
        weekNumber: 0,
      }),
    ).toThrow();
  });
});
