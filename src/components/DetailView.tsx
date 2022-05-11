import { useContextualRouting } from "next-use-contextual-routing";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getOutputById } from "../graphql";
import { OutputByIdQuery } from "../graphql/cms";
import { SocialMeta } from "./SocialMeta";

interface Props {
  prefetchedData?: OutputByIdQuery;
  id: string;
  onClose?: () => void;
  closeHref?: string;
  isModal?: boolean;
}

export function DetailView({
  prefetchedData,
  id,
  onClose,
  closeHref,
  isModal,
}: Props) {
  const router = useRouter();
  const { makeContextualHref } = useContextualRouting();
  const [data, setData] = useState(prefetchedData);

  useEffect(() => {
    if (!prefetchedData || prefetchedData.asset?.id !== id) {
      getOutputById({ id, cursor: id }).then((data) => setData(data));
    }
  }, [prefetchedData, id]);

  const asset = data && data.asset;
  const prevId =
    isModal && data && data.prev && data.prev.length > 0
      ? data.prev[0].id
      : null;
  const nextId =
    isModal && data && data.next && data.next.length > 0
      ? data.next[0].id
      : null;

  useEffect(() => {
    const downHandler = ({ key }: KeyboardEvent) => {
      if (["ArrowLeft", "p"].includes(key) && prevId) {
        router.replace(makeContextualHref({ id: prevId }), `/${prevId}`, {
          scroll: false,
        });
      }
      if (["ArrowRight", "n"].includes(key) && nextId) {
        router.replace(makeContextualHref({ id: nextId }), `/${nextId}`, {
          scroll: false,
        });
      }
      if (["Escape"].includes(key)) {
        if (closeHref) router.push(closeHref);
        if (onClose) onClose();
      }
    };

    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [prevId, nextId, makeContextualHref, router]);

  return asset ? (
    <>
      <SocialMeta
        title={`${asset.prompt} | Artificial Creation`}
        socialImage={asset.url}
      />
      <div key={asset.id} className="detail-page">
        <p className="detail-page-prompt">{asset.prompt}</p>

        <div className="detail-page-image">
          <Image
            src={asset.url}
            alt={`"${asset.prompt}" made with MidJourney`}
            layout="fill"
            objectFit="contain"
          />
        </div>

        {!onClose && (
          <p className="detail-page-close">
            <Link href={closeHref || "/"} scroll={false}>
              <a>ESC</a>
            </Link>
          </p>
        )}

        {onClose && (
          <button className="detail-page-close" onClick={onClose}>
            <a>ESC</a>
          </button>
        )}

        <p className="detail-page-prev">
          {prevId ? (
            <Link
              href={makeContextualHref({ id: prevId })}
              as={`/${prevId}`}
              scroll={false}
              replace
            >
              <a>(P)</a>
            </Link>
          ) : (
            <span className="invisible">(P)</span>
          )}
        </p>

        <p className="detail-page-next">
          {nextId ? (
            <Link
              href={makeContextualHref({ id: nextId })}
              as={`/${nextId}`}
              scroll={false}
              replace
            >
              <a>(N)</a>
            </Link>
          ) : (
            <span className="invisible">(N)</span>
          )}
        </p>
      </div>
    </>
  ) : null;
}
