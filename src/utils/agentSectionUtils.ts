export const DATA_SOURCE_TABS = ["links", "files", "text", "qna"];

export const AGENT_SECTION_LABELS: Record<string, string> = {
  general: "General",
  personalize: "Personalize",
  "data-source": "Data Source",
  "live-visitors": "Chat Sessions",
  "lead-collection": "Lead Collection",
  "human-handover": "Human Handover",
};

export const LEAD_COLLECTION_INSET_CLASS =
  "px-0 sm:px-4 md:px-12 lg:px-28 xl:px-36 2xl:px-44";

export function getSectionLabel(section: string) {
  return AGENT_SECTION_LABELS[section] ?? "General";
}

const NO_TAB_SECTIONS = [
  "general",
  "personalize",
  "live-visitors",
  "lead-collection",
  "human-handover",
];

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
    section === "live-visitors" ||
    section === "lead-collection" ||
    section === "human-handover"
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
