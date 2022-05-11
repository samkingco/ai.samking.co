import { useRouter } from "next/router";
import React from "react";
import { DetailView } from "../components/DetailView";

function getStringFromQuery(str?: string | string[]) {
  if (Array.isArray(str)) return str[0];
  return str;
}

export default function PostPage() {
  const router = useRouter();
  const { id: idParam } = router.query;
  const id = getStringFromQuery(idParam);
  return id ? <DetailView id={id} /> : null;
}
