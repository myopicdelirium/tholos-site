export type EventType = "Salon" | "Colloquium" | "Workshop" | "Working Session" | "Field Session";

export type EventRecord = {
  id: string;
  title: string;
  type: EventType;
  dateStart: string;
  dateEnd?: string;
  timezone?: string;
  location?: string;
  mode?: "In-person" | "Remote" | "Hybrid";
  status?: "Upcoming" | "Archive";
  blurb?: string;
  description?: string;
  speakers?: string[];
  reading?: Array<{ title: string; author?: string; href?: string }>;
  registerHref?: string;
};

export const EVENTS: EventRecord[] = [
  {
    id: "salon-001",
    title: "Measurement, Trust Decay, and Institutional Attention",
    type: "Salon",
    dateStart: "2026-02-06T18:30:00-05:00",
    timezone: "America/New_York",
    location: "Hoboken, NJ",
    mode: "In-person",
    status: "Upcoming",
    blurb: "A closed-format discussion on metric pressure and civic legitimacy.",
    description:
      "We examine how performance metrics shape organizational behavior, what gets distorted under reporting pressure, and how trust decays when measurement becomes proxy governance.",
    speakers: ["Myopic Delirium core team"],
    reading: [
      { title: "Goodhart’s Law and Institutional Behavior", author: "Selected notes" }
    ],
    registerHref: "/connect"
  },
  {
    id: "colloq-archive-004",
    title: "Emergent Hierarchy in Resource-Constrained Agent Ecologies",
    type: "Colloquium",
    dateStart: "2025-10-18T17:00:00-04:00",
    timezone: "America/New_York",
    location: "Remote",
    mode: "Remote",
    status: "Archive",
    blurb: "Methods and results from early multi-agent environment prototypes.",
    description:
      "We present prototype results on how scarcity and bounded cognition generate stable hierarchy, coalition behavior, and ideological clustering across runs.",
    speakers: ["Felix Tinio"],
    reading: [
      { title: "Model notes and run logs", author: "Internal archive", href: "/logbook" }
    ],
    registerHref: ""
  }
];
