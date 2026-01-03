import { version, lastUpdated } from "@/lib/version"

export default function Releases() {
  return (
    <section>
      <h2>Releases</h2>
      <p>Current stable: {version}</p>
      <p>Last updated: {lastUpdated}</p>
      <ul>
        <li>{version} — Current stable</li>
      </ul>
    </section>
  )
}
