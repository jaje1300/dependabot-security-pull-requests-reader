import {
  DiscussionCommentsType,
  Octokit,
  ReviewCommentsType,
  handleRateLimit,
} from './octokit-service';
import { handleError, logLogs } from './log-service';
import { prStatus, cleanUrl, fileName } from './transformation-helper';

// Helper function to fetch and process comments
export const getReviewComments = async (
  props: TypeProps,
  dspr: any,
  octokit: Octokit,
) => {
  const comments: ReviewCommentsType = [];
  const cleanedUrl = cleanUrl(dspr.comments_url);
  const dsprStatus = prStatus(dspr);
  let logTotal = '';
  //console.log(`review, dsprStatus: ${dsprStatus}, cleanedUrl: ${cleanedUrl}`);
  console.log(
    `review, dsprStatus: ${dsprStatus}, cleanedUrl substring: ${cleanedUrl.substring(
      28,
    )}`,
  );
  try {
    //get some other PR comments too? Unique: Associated with a specific PR...
    for await (const response of octokit.paginate.iterator(
      octokit.pulls.listReviewComments,
      {
        owner: dspr.repoFullName.split('/')[0],
        repo: dspr.repoFullName.split('/')[1],
        pull_number: dspr.number,
      },
    )) {
      const logCommentsPagination = `[${props.id}-${props.dataset}] Found ${response.data.length} review comments in PR ${dspr.number} on repo ${dspr.repoFullName}`;
      console.log(logCommentsPagination);
      logTotal += `${logCommentsPagination}\n`;

      if (response.data.length > 0) {
        const transformedComments = response.data.map((comment) => ({
          ...comment,
          cleanUrl: cleanedUrl,
          dsprStatus: dsprStatus,
        }));
        comments.push(...transformedComments);
        if (props.testRun) {
          console.log('found review comment, breaking early');
          break; // troubleshoot, first dspr repo with comments
        }
      }
      await handleRateLimit(octokit);
    }
  } catch (error) {
    await handleRateLimit(octokit);
    handleError(props, error, 'get-review-comments');
  }
  await logLogs(
    props,
    fileName(dspr.repoFullName),
    logTotal,
    'get-review-comments',
  );
  return comments;
};

export const getDiscussionComments = async (
  props: TypeProps,
  dspr: any,
  octokit: Octokit,
) => {
  const comments: DiscussionCommentsType = [];
  const cleanedUrl = cleanUrl(dspr.comments_url);
  const dsprStatus = prStatus(dspr);
  console.log(
    `discussion, dsprStatus: ${dsprStatus}, cleanedUrl substring: ${cleanedUrl.substring(
      28,
    )}`,
  );
  // Extract the issue number from the issue URL
  const issueUrl = dspr.issue_url; //copy?
  const issueNumber = issueUrl.split('/').pop(); // Get the last segment (issue number)
  console.log(`Issue number associated with PR ${dspr.number}: ${issueNumber}`);

  let logTotal = '';
  try {
    for await (const response of octokit.paginate.iterator(
      octokit.issues.listComments,
      {
        owner: dspr.repoFullName.split('/')[0],
        repo: dspr.repoFullName.split('/')[1],
        pull_number: dspr.number,
        issue_number: issueNumber,
      },
    )) {
      const logCommentsPagination = `[${props.id}-${props.dataset}] Found ${response.data.length} discussion comments for issue ${issueNumber} in PR ${dspr.number} on repo ${dspr.repoFullName}`;
      console.log(logCommentsPagination);
      logTotal += `${logCommentsPagination}\n`;

      if (response.data.length > 0) {
        const transformedComments = response.data.map((comment) => ({
          ...comment,
          cleanUrl: cleanedUrl,
          dsprStatus: dsprStatus,
        }));
        comments.push(...transformedComments);
        if (props.testRun) {
          console.log('found discussion comment, breaking early');
          break; // troubleshoot, first dspr repo with comments
        }
      }
      await handleRateLimit(octokit);
    }
  } catch (error) {
    await handleRateLimit(octokit);
    handleError(props, error, 'get-discussion-comments');
  }
  await logLogs(
    props,
    fileName(dspr.repoFullName),
    logTotal,
    'get-discussion-comments',
  );
  return comments;
};
