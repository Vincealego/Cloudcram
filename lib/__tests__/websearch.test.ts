import { describe, it, expect } from "vitest";
import { cleanQuery, metaDescription, firstSentences } from "../websearch";
describe("websearch helpers", () => {
  it("cleans question phrasing", () => { expect(cleanQuery("What is Azure Cosmos DB?")).toBe("Azure Cosmos DB"); expect(cleanQuery("explain serverless")).toBe("serverless"); });
  it("reads a page's meta description in either attribute order", () => {
    expect(metaDescription(`<head><meta name="description" content="Azure Cosmos DB is a fully managed &amp; fast database."></head>`)).toBe("Azure Cosmos DB is a fully managed & fast database.");
    expect(metaDescription(`<meta content="Hello there" name="description">`)).toBe("Hello there");
    expect(metaDescription("<p>nothing</p>")).toBe("");
  });
  it("shortens at a sentence end", () => { const t = "First sentence is here and it is quite long indeed so that it passes sixty chars. " + "Second ".repeat(60); expect(firstSentences(t, 120).endsWith("chars.")).toBe(true); });
});
