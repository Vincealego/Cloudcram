import { describe, it, expect } from "vitest";
import { findTopic, type Topic } from "../buddy"; import lib from "../buddy-offline.json"; import { relevance } from "../websearch";
const T = lib as Topic[], t = (q: string) => findTopic(q, T)?.title ?? "";
describe("buddy library", () => {
  it("finds common AZ-900 concepts", () => {
    expect(t("vertical scaling")).toMatch(/Vertical scaling/); expect(t("what is horizontal scaling?")).toMatch(/Horizontal/);
    expect(t("What are resource locks")).toMatch(/Resource locks/); expect(t("explain ARM templates")).toMatch(/Resource Manager/);
    expect(t("what is azure")).toMatch(/What is Azure/); expect(t("azure")).toMatch(/What is Azure/); expect(t("tell me about Azure Cosmos DB")).toMatch(/Databases/);
    expect(t("what is azure cosmos db")).toMatch(/Databases/); expect(t("difference between vnet peering and expressroute")).toMatch(/Peering/);
  });
  it("does not match inside other words", () => { expect(t("farm animals")).toBe(""); });
  it("every entry has keys and text", () => T.forEach(e => { expect(e.keys.length).toBeGreaterThan(0); expect(e.text.length).toBeGreaterThan(40); }));
});
describe("web relevance", () => { it("drops off-topic results", () => { expect(relevance("vertical scaling", "Azure Functions Scale and Hosting")).toBe(0); expect(relevance("cosmos db", "Azure Cosmos DB overview")).toBe(1); }); });
