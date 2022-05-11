import {
  AllOutputIdsQuery,
  AllOutputIdsQueryVariables,
  OutputByIdQuery,
  OutputByIdQueryVariables,
  OutputsQuery,
  OutputsQueryVariables,
} from "./cms";

async function fetchAPI<T, V = {}>(query: string, variables?: V): Promise<T> {
  const res = await fetch(process.env.NEXT_PUBLIC_CMS_ENDPOINT || "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error(json.errors);
    throw new Error("Failed to fetch API");
  }
  return json.data;
}

export const outputsDocument = /* GraphQL */ `
  query Outputs($first: Int!, $after: String) {
    assetsConnection(orderBy: createdAt_DESC, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
        startCursor
        pageSize
      }
      aggregate {
        count
      }
      edges {
        node {
          id
          prompt
          url
          width
          height
        }
      }
    }
  }
`;

export async function getOutputs(variables: OutputsQueryVariables) {
  const data = await fetchAPI<OutputsQuery, OutputsQueryVariables>(
    outputsDocument,
    variables
  );
  return data;
}

export const outputByIdDocument = /* GraphQL */ `
  query OutputById($id: ID, $cursor: String) {
    asset(where: { id: $id }) {
      id
      prompt
      url
      width
      height
    }
    prev: assets(orderBy: createdAt_DESC, last: 1, before: $cursor) {
      id
    }
    next: assets(orderBy: createdAt_DESC, first: 1, after: $cursor) {
      id
    }
  }
`;

export async function getOutputById(variables: OutputByIdQueryVariables) {
  const data = await fetchAPI<OutputByIdQuery, OutputByIdQueryVariables>(
    outputByIdDocument,
    variables
  );
  return data;
}

export const allOutputIdsDocument = /* GraphQL */ `
  query AllOutputIds($first: Int!, $after: String) {
    assetsConnection(orderBy: createdAt_DESC, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      aggregate {
        count
      }
      edges {
        node {
          id
        }
      }
    }
  }
`;

async function fetchAllOutputIds(
  variables: AllOutputIdsQueryVariables
): Promise<AllOutputIdsQuery[]> {
  const pages: AllOutputIdsQuery[] = [];
  const data = await fetchAPI<AllOutputIdsQuery, AllOutputIdsQueryVariables>(
    allOutputIdsDocument,
    variables
  );
  if (data.assetsConnection.pageInfo.hasNextPage) {
    return pages.concat(
      data,
      await fetchAllOutputIds({
        ...variables,
        after: data.assetsConnection.pageInfo.endCursor,
      })
    );
  } else {
    return new Promise((resolve) => resolve(pages.concat(data)));
  }
}

export async function getAllOutputIds(first: number) {
  const data = await fetchAllOutputIds({ first });
  const ids: string[] = [];
  for (const page of data) {
    for (const edge of page.assetsConnection.edges) {
      ids.push(edge.node.id);
    }
  }
  return ids;
}
