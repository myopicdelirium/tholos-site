import type { Artifact } from "./types"

const a: Artifact = {
  slug: "eine-konfigurierbare-zyklische-oekologie",
  title: "Eine konfigurierbare zyklische Ökologie für agentenbasierte Experimente mit langem Zeithorizont unter Bedingungen von Ressourcenknappheit und Prädation.",
  status: "Working paper",
  year: "2026",
  updated: "2026-01-17",
  authors: ["Alfonso Leder", "Felix P. Tinio", "Emil Andersson"],
  keywords: ["Ökologie", "ABM", "Knappheit", "Prädation", "Umwelt"],
  abstract: `Wir stellen eine konfigurierbare, räumlich explizite Umgebung vor, die agentenbasierte Experimente über lange Zeiträume unter Knappheit, Risiko und wechselnden Bedingungen ermöglicht. Die Welt besteht aus einem 256×256-Raster, in dem jede Zelle einen sich regenerierenden Ressourcenzustand aufweist, der durch zyklische Nachschubdynamiken gesteuert wird. Dies ermöglicht wiederholte Boom-Bust-Zyklen und lokale Erschöpfung/Erholung ohne extern gesteuerte Ereignisse. Agenten bewegen sich durch eine kontinuierliche Kostenlandschaft (z. B. Geländereibung und Reiseaufwand) und interagieren dabei mit mehreren ökologischen Schichten: erneuerbaren Nahrungsquellen, mobilen Tieren, die gejagt oder gemieden werden können, und Raubtieren, die ein anhaltendes exogenes Sterblichkeitsrisiko darstellen und einen Kompromiss zwischen Ausbeutung und Sicherheit erzwingen. Die Umgebung ist so parametrisiert, dass wichtige Bedingungen (Ressourcenregenerationsraten, Amplitude des saisonalen Zyklus, Raubtierdichte und -letalität, Tierbewegung und -ertrag sowie allgemeine Volatilität) während des Laufs angepasst oder gestört werden können. Dies ermöglicht kontrollierte Schocks, Regimewechsel und vergleichende Statik über mehrere Simulationen mit unterschiedlichen Startbedingungen. Dieses Design unterstützt sowohl Mikroebenen-Realismus (lokaler Wettbewerb, Territorialität, Patch-Auswahl und risikosensitive Bewegung) als auch Makroebenen-Interpretierbarkeit (Gesamtüberleben, Reproduktion, Ungleichheit und Strategiezusammensetzung) und bleibt gleichzeitig für große Experimentreihen rechnerisch handhabbar. Indem die Welt nicht als statischer Hintergrund, sondern als sich entwickelnde, manipulierbare Ökologie betrachtet wird, dient die Umgebung als experimentelles Substrat, um zu untersuchen, wie interne Agentenmechanismen unter stabilen Perioden, saisonalen Einschränkungen und abrupten Umweltveränderungen zu Populationsdynamiken führen.`,
  previewImage: "/artifacts/eine-konfigurierbare-zyklische-oekologie/page1.png",
  contactEmail: "myopicdelirium@gmail.com",
}

export default a
