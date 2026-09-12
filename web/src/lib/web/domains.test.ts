import { describe, expect, it } from "vitest";
import { checkDomain, labelFromName, normaliseDomain, priceLine, tldOf } from "./domains";

describe("domains", () => {
  it("normalises messy input", () => {
    expect(normaliseDomain("https://www.Example.com/pricing?x=1")).toBe("example.com");
    expect(normaliseDomain("launchabl")).toBeNull();
    expect(normaliseDomain("bad_name.com")).toBeNull();
    expect(labelFromName("Café & Co!")).toBe("cafeandco");
    expect(tldOf("shop.example.co.uk")).toBe("co.uk");
    expect(tldOf("example.io")).toBe("io");
    expect(priceLine("ai")).toMatch(/first year/);
    expect(priceLine("zzz")).toBeNull();
  });

  it("reads RDAP: 404 = available, 200 = taken with registrar and dates", async () => {
    const fetchImpl = (async (url: RequestInfo | URL) => {
      const u = String(url);
      if (u.includes("data.iana.org")) return new Response(JSON.stringify({ services: [[["com"], ["https://rdap.example-registry.test/"]]] }), { status: 200 });
      expect(u.startsWith("https://rdap.example-registry.test/domain/")).toBe(true);
      if (u.endsWith("/free-name.com")) return new Response("", { status: 404 });
      return new Response(
        JSON.stringify({
          status: ["client transfer prohibited"],
          events: [
            { eventAction: "registration", eventDate: "2015-03-01T00:00:00Z" },
            { eventAction: "expiration", eventDate: "2027-03-01T00:00:00Z" },
          ],
          entities: [{ roles: ["registrar"], vcardArray: ["vcard", [["fn", {}, "text", "Cloudflare, Inc."]]] }],
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const free = await checkDomain("free-name.com", { fetchImpl });
    expect(free.status).toBe("available");
    expect(free.source).toBe("rdap");

    const taken = await checkDomain("Taken.com", { fetchImpl });
    expect(taken.status).toBe("taken");
    expect(taken.registrar).toBe("Cloudflare, Inc.");
    expect(taken.registered).toBe("2015-03-01");
    expect(taken.expires).toBe("2027-03-01");
    expect(taken.flags).toEqual(["client transfer prohibited"]);
  });
});
