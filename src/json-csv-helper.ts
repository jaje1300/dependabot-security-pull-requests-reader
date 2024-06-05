import { cleanUrl, prStatus, singleLineItem } from './transformation-helper';

export function transformToMetaJsonSecurityPulls(
  jsonSecurityPulls: any[],
): any[] {
  // meta dataset (repository_url_short,url, comments_url, status, title, body, closed_by) after excluding open state PRs
  const metaJsonSecurityPulls = jsonSecurityPulls.map((dspr) => ({
    repository_url_short: dspr.repoFullName,
    url: cleanUrl(dspr.comments_url),
    comments_url: dspr.comments_url,
    status: prStatus(dspr),
    title: dspr.title,
    body: singleLineItem(dspr.body),
    closed_by: dspr.user?.login, // dspr.closed_by
  }));

  return metaJsonSecurityPulls;
}

const pullRequestUrl = (comment: any, commentType: TypeComments) => {
  if (commentType === 'review') {
    return comment.pull_request_url;
  } else {
    //- "https://github.com/facebook/react/pull/27527#issuecomment-1773012477"
    // use 'html_url' and grab pr number between 'pull/' and '#issuecomment'
    //const prNumber = comment.html_url.split('pull/')[1].split('#')[0];
    // just grab url before '#issuecomment'
    const prUrl = comment.html_url.split('#')[0];
    return prUrl;
  }
};

export function transformToComments(
  comments: any[],
  commentType: TypeComments,
): any[] {
  const commentsJson = comments.map((comment) => ({
    id: comment.id,
    url: comment.url,
    cleanUrl: comment.cleanUrl,
    dsprStatus: comment.dsprStatus,
    pull_request_url: pullRequestUrl(comment, commentType),
    body: singleLineItem(comment.body),
  }));
  return commentsJson;
}

//transformJsonToCsv().catch(console.error);
