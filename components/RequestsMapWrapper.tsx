"use client";

import dynamic from "next/dynamic";

const RequestsMap = dynamic(() => import("@/components/RequestsMap"), {
  ssr: false,
});

export default function RequestsMapWrapper({
  requests,
}: {
  requests: unknown[];
}) {
  return <RequestsMap requests={requests as any} />;
}