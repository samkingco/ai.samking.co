import { GetStaticProps, InferGetStaticPropsType } from "next";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import React from "react";
import { DetailView } from "../components/DetailView";
import { getAllOutputIds, getOutputById } from "../graphql";
import { OutputByIdQuery } from "../graphql/cms";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export const getStaticProps: GetStaticProps<{
  data: OutputByIdQuery;
}> = async (context) => {
  const { id } = context.params as IParams;
  const data = await getOutputById({ id, cursor: id });
  return { props: { data } };
};

export async function getStaticPaths() {
  const ids = await getAllOutputIds(1000);
  return {
    paths: ids.map((id) => ({ params: { id } })),
    fallback: false,
  };
}

export default function PostPage({
  data,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const { id } = router.query as IParams;
  return id ? <DetailView id={id} prefetchedData={data} /> : null;
}
