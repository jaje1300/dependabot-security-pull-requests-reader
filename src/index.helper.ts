export const failSafe = (
  props: TypeProps,
  jsonDataset: any[],
  jsonReviewComments: any[],
  jsonDiscussionComments: any[],
) => {
  if (!jsonDataset) {
    throw new Error('No data found');
  }
  if (jsonDataset && jsonDataset.length === 0) {
    throw new Error('Dataset Empty');
  }

  if (!jsonReviewComments) {
    throw new Error('No Review Comments found');
  }
  if (
    jsonReviewComments &&
    jsonReviewComments.length === 0 &&
    props.comments.includeComments
  ) {
    throw new Error('Review Comments Empty');
  }

  if (!jsonDiscussionComments) {
    throw new Error('No Discussion Comments found');
  }
  if (
    jsonDiscussionComments &&
    jsonDiscussionComments.length === 0 &&
    props.comments.includeComments
  ) {
    throw new Error('Comments Empty');
  }
};
