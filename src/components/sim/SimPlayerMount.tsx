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
      className="aspect-[16/10] w-full rounded-[6px] border"
      style={{ borderColor: "rgba(133,118,101,0.4)", background: "#0e1a20" }}
      aria-hidden
    />
  ),
});

export default function SimPlayerMount(props: SimPlayerProps) {
  return <SimPlayer {...props} />;
}
