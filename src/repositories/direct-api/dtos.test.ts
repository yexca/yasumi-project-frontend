import { describe, expect, it } from "vitest";

import { parseApiErrorDto, parseAuthResponseDto } from "@/repositories/direct-api/dtos";

describe("phase 03 direct API DTO parsing", () => {
  it("accepts valid auth responses", () => {
    expect(
      parseAuthResponseDto({
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          username: "yasumi",
          email: "yasumi@example.com",
          display_name: null,
        },
        session: {
          authenticated: true,
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_at: "2026-06-13T09:00:00Z",
        },
      }),
    ).toMatchObject({
      user: {
        username: "yasumi",
      },
      session: {
        authenticated: true,
      },
    });
  });

  it("rejects malformed auth responses", () => {
    expect(() =>
      parseAuthResponseDto({
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          username: "yasumi",
          email: "not-an-email",
          display_name: null,
        },
        session: {
          authenticated: true,
          access_token: "",
          refresh_token: "refresh-token",
          expires_at: "not-an-instant",
        },
      }),
    ).toThrow();
  });

  it("parses stable backend error DTOs without using diagnostic message as UI copy", () => {
    expect(
      parseApiErrorDto({
        code: "validation_failed",
        message: "Diagnostic only.",
        fields: {
          scheduled_date: "required_for_date_task",
        },
        retryable: false,
      }),
    ).toEqual({
      code: "validation_failed",
      message: "Diagnostic only.",
      fields: {
        scheduled_date: "required_for_date_task",
      },
      retryable: false,
    });
  });
});
