// To add a certification, copy this file and change the data. Nothing else needs to change.
export const CERT = {
  id: "az900", name: "AZ-900 Azure Fundamentals",
  disclaimer: "Unofficial study aid. Not affiliated with or endorsed by Microsoft.",
  // Source: Microsoft Learn AZ-900 study guide, skills measured as of January 14, 2026 (domains 25-30%, 35-40%, 30-35%).
  // Weights below are range midpoints. Re-check the guide before each exam season.
  domains: [
    { id: 0, name: "Cloud concepts", weight: 0.275, objectives: [
      "Describe cloud computing", "Describe the benefits of using cloud services", "Describe cloud service types"] },
    { id: 1, name: "Azure architecture & services", weight: 0.375, objectives: [
      "Describe the core architectural components of Azure", "Describe Azure compute and networking services",
      "Describe Azure storage services", "Describe Azure identity, access, and security"] },
    { id: 2, name: "Management & governance", weight: 0.325, objectives: [
      "Describe cost management in Azure", "Describe features and tools in Azure for governance and compliance",
      "Describe features and tools for managing and deploying Azure resources", "Describe monitoring tools in Azure"] },
  ],
} as const;
export const OBJECTIVES = CERT.domains.flatMap(d => d.objectives.map(o => ({ domain: d.id, objective: o as string })));
