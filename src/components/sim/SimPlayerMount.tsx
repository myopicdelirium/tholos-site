"use client";

// Dynamically imports the player with ssr:false so canvas / typed-array code
// never runs on the Vercel server (WO-V4). The page shell stays server-rendered
// and instant; the player lazy-mounts on the client.

import dynamic from "next/dynamic";
import type { SimPlayerProps } from "./SimPlayer";

const SimPlayer = dynamic(() => import("./SimPlayer"), {
  ssr: false,
  loading: () => (
    <div
      className="aspect-[3/2] w-full rounded-[4px] border rule"
      style={{ background: "rgb(var(--ivory))" }}
      aria-hidden
    />
  ),
});

export default function SimPlayerMount(props: SimPlayerProps) {
  return <SimPlayer {...props} />;
}
