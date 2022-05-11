import { useContextualRouting } from "next-use-contextual-routing";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { DetailView } from "../components/DetailView";
import { Modal } from "../components/Modal";
import { SocialMeta } from "../components/SocialMeta";
import { OutputsQueryVariables, useOutputsQuery } from "../graphql/cms";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import usePreviousValue from "../hooks/usePreviousValue";

interface GridProps {
  variables: OutputsQueryVariables;
  isLastPage: boolean;
  onLoadMore: (endCursor: string | null | undefined) => void;
}

function GridContents({ variables, isLastPage, onLoadMore }: GridProps) {
  const { makeContextualHref } = useContextualRouting();
  const [outputsQuery] = useOutputsQuery({ variables });
  const { data, fetching } = outputsQuery;
  const assets = data && data.assetsConnection;
  const hasNextPage = assets?.pageInfo.hasNextPage;
  const endCursor = assets?.pageInfo.endCursor;

  const loadMoreRef = useRef(null);
  const { isVisible } = useIntersectionObserver(loadMoreRef, {});
  const wasVisible = usePreviousValue(isVisible);

  useEffect(() => {
    // Load more when:
    // 1. load more intersection comes into view
    // 2. and we're not loading more already
    // 3. and there are more pages to load
    if (!wasVisible && isVisible && hasNextPage && !fetching) {
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
          <button onClick={() => onLoadMore(endCursor)}>load more</button>
        </div>
      )}
      {fetching && <p>loading...</p>}
    </>
  );
}

export default function IndexPage() {
  const first = 100;
  const [pageVariables, setPageVariables] = useState<OutputsQueryVariables[]>([
    { first },
  ]);

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
          {pageVariables.map((variables, i) => (
            <GridContents
              key={variables.after ? variables.after : `grid_${i}`}
              variables={variables}
              isLastPage={i === pageVariables.length - 1}
              onLoadMore={(after) => {
                setPageVariables([...pageVariables, { after, first }]);
              }}
            />
          ))}
        </section>

        <Modal
          a11yLabel={`Detail view`}
          isOpen={Boolean(!!router.query.id && modalId)}
          onClose={onModalClose}
        >
          {modalId && <DetailView id={modalId} onClose={onModalClose} />}
        </Modal>
      </main>
    </div>
  );
}
