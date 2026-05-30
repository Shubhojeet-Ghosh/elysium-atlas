export const DATA_SOURCE_TABS = ["links", "files", "text", "qna"];

export const AGENT_SECTION_LABELS: Record<string, string> = {
  general: "General",
  personalize: "Personalize",
  "data-source": "Data Source",
  "live-visitors": "Live Visitors",
};

export function getSectionLabel(section: string) {
  return AGENT_SECTION_LABELS[section] ?? "General";
}

const NO_TAB_SECTIONS = ["general", "personalize", "live-visitors"];

export function isNoTabSection(section: string) {
  return NO_TAB_SECTIONS.includes(section);
}

export function resolveSection(searchParams: URLSearchParams) {
  const section = searchParams.get("section");
  const activeTab = searchParams.get("activeTab");

  if (
    section === "data-source" ||
    section === "general" ||
    section === "personalize" ||
    section === "live-visitors"
  ) {
    return section;
  }

  if (activeTab === "personalize") {
    return "personalize";
  }

  if (activeTab === "live-visitors") {
    return "live-visitors";
  }

  if (activeTab && DATA_SOURCE_TABS.includes(activeTab)) {
    return "data-source";
  }

  return "general";
}

export function resolveActiveTab(
  searchParams: URLSearchParams,
  section: string,
) {
  if (isNoTabSection(section)) {
    return "";
  }

  const activeTab = searchParams.get("activeTab");
  const defaultTab = "links";

  if (activeTab && DATA_SOURCE_TABS.includes(activeTab)) {
    return activeTab;
  }

  return defaultTab;
}
