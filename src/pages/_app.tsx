import "@reach/dialog/styles.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";
import { Provider as GraphqlProvider } from "urql";
import { client } from "../graphql";
import "../styles/globals.css";

export default function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <GraphqlProvider value={client}>
      <Head>
        <script
          defer
          data-domain="ai.samking.co"
          src="https://plausible.io/js/plausible.js"
        ></script>
      </Head>
      <Component {...pageProps} />
    </GraphqlProvider>
  );
}
