import { GetStaticProps, InferGetStaticPropsType } from "next";
import { useContextualRouting } from "next-use-contextual-routing";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { DetailView } from "../components/DetailView";
import { Modal } from "../components/Modal";
import { SocialMeta } from "../components/SocialMeta";
import { getOutputs } from "../graphql";
import { OutputsQuery } from "../graphql/cms";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import usePreviousValue from "../hooks/usePreviousValue";

const PAGE_SIZE = 1000;

interface GridProps {
  queryResult: OutputsQuery;
  isLastPage: boolean;
  isFetching: boolean;
  onLoadMore: (endCursor: string | null | undefined) => void;
}

function GridContents({
  queryResult,
  isLastPage,
  isFetching,
  onLoadMore,
}: GridProps) {
  const { makeContextualHref } = useContextualRouting();
  const assets = queryResult.assetsConnection;
  const hasNextPage = assets.pageInfo.hasNextPage;
  const endCursor = assets.pageInfo.endCursor;

  const loadMoreRef = useRef(null);
  const { isVisible } = useIntersectionObserver(loadMoreRef, {});
  const wasVisible = usePreviousValue(isVisible);

  useEffect(() => {
    // Load more when:
    // 1. load more intersection comes into view
    // 2. and we're not loading more already
    // 3. and there are more pages to load
    if (!wasVisible && isVisible && hasNextPage && !isFetching) {
      onLoadMore(endCursor);
    }
  }, [wasVisible, isVisible, hasNextPage, endCursor, onLoadMore]);

  return (
    <>
      {assets &&
        assets.edges.length > 0 &&
        assets.edges.map(({ node: output }) => (
          <Link
            key={output.id}
            href={makeContextualHref({ id: output.id })}
            as={`/${output.id}`}
            scroll={false}
          >
            <a>
              <Image
                src={output.url}
                alt={`"${output.prompt}" made with MidJourney`}
                width={output.width?.toString()}
                height={output.height?.toString()}
                layout="responsive"
              />
            </a>
          </Link>
        ))}
      {isLastPage && assets && hasNextPage && endCursor && (
        <div ref={loadMoreRef} className="load-more-area">
          {isFetching ? (
            <p>loading...</p>
          ) : (
            <button onClick={() => onLoadMore(endCursor)}>load more</button>
          )}
        </div>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  initialQuery: OutputsQuery;
}> = async () => {
  const initialQuery = await getOutputs({ first: PAGE_SIZE });
  return { props: { initialQuery } };
};

export default function IndexPage({
  initialQuery,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [pages, setPages] = useState<OutputsQuery[]>([initialQuery]);
  const [fetching, setFetching] = useState(false);

  const router = useRouter();
  const { returnHref } = useContextualRouting();
  const [modalId, setModalId] = useState<string | undefined>();

  const onModalClose = () => {
    router.push(returnHref, undefined, { scroll: false });
  };

  useEffect(() => {
    const newModalId = Array.isArray(router.query.id)
      ? router.query.id[0]
      : router.query.id;
    setModalId(newModalId);
    return () => {
      setModalId(undefined);
    };
  }, [router.query.id]);

  return (
    <div className="app-wrapper">
      <SocialMeta />
      <main>
        <h1>Artificial Creation</h1>
        <p>All outputs are currently from MidJourney</p>

        <section className="outputs-grid">
          {pages.map((page, i) => (
            <GridContents
              key={page.assetsConnection.pageInfo.endCursor || `grid_${i}`}
              queryResult={page}
              isLastPage={i === pages.length - 1}
              isFetching={fetching}
              onLoadMore={(after) => {
                setFetching(true);
                getOutputs({ first: PAGE_SIZE, after }).then((page) => {
                  setFetching(false);
                  setPages([...pages, page]);
                });
              }}
            />
          ))}
        </section>

        <Modal
          a11yLabel={`Detail view`}
          isOpen={Boolean(!!router.query.id && modalId)}
          onClose={onModalClose}
        >
          {modalId && (
            <DetailView id={modalId} onClose={onModalClose} isModal />
          )}
        </Modal>
      </main>
    </div>
  );
}
