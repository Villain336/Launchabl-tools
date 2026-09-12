import { describe, expect, it } from "vitest";
import { hasGatewayAuth } from "./models";

describe("gateway auth detection", () => {
  it("accepts an explicit key", () => {
    expect(hasGatewayAuth({ AI_GATEWAY_API_KEY: "vck_x" })).toBe(true);
  });

  it("accepts a Vercel deployment without a key (OIDC handled by the provider)", () => {
    expect(hasGatewayAuth({ VERCEL: "1" })).toBe(true);
    expect(hasGatewayAuth({ VERCEL_OIDC_TOKEN: "eyJ..." })).toBe(true);
  });

  it("rejects a bare environment", () => {
    expect(hasGatewayAuth({})).toBe(false);
    expect(hasGatewayAuth({ VERCEL: "", AI_GATEWAY_API_KEY: "" })).toBe(false);
  });
});
