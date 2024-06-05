import { handleError, logLogs, logStats } from './log-service';
import {
  Octokit,
  ReviewCommentsType,
  DiscussionCommentsType,
} from './octokit-service';
import {
  getDiscussionComments,
  getReviewComments,
} from './octo-comment-repository';

async function fetchComments(
  props: TypeProps,
  jsonSecurityPulls: any[],
  octokit: Octokit,
  commentType: TypeComments,
) {
  const jsonComments: any[] = [];
  try {
    if (props.comments.includeComments) {
      console.log(
        `[${props.id}-${props.dataset}] Fetching ${commentType} comments...`,
      );
      let count = 0;
      for (const dspr of jsonSecurityPulls) {
        count++;
        console.time(`Get ${commentType} comments ${count}`);
        let dsprComments: any[] = []; // Explicitly declare the type of dsprComments
        if (commentType === 'review') {
          dsprComments = await getReviewComments(props, dspr, octokit);
        }
        if (commentType === 'discussion') {
          dsprComments = await getDiscussionComments(props, dspr, octokit);
        }
        jsonComments.push(...dsprComments);
        console.timeEnd(`Get ${commentType} comments ${count}`);
      }
    }
    const logCommentsTotal = `[${props.id}-${props.dataset}] Found ${jsonComments.length} ${commentType} comments in total`;
    console.log(logCommentsTotal);
    await logLogs(props, `fetch-comments-${commentType}`, logCommentsTotal);
    await logStats(props, `fetch-comments-${commentType}`, logCommentsTotal);
  } catch (error) {
    await handleError(props, error, `fetch-comments-${commentType}`);
  }
  return jsonComments;
}

export async function getComments(
  props: TypeProps,
  jsonSecurityPulls: any[],
  octokit: Octokit,
) {
  // review comments   //Unique: Tied to specific lines of code.
  const jsonReviewComments: ReviewCommentsType = await fetchComments(
    props,
    jsonSecurityPulls,
    octokit,
    'review',
  );

  //discussion comments //Unique: Can cover broader topics?
  const jsonDiscussionComments: DiscussionCommentsType = await fetchComments(
    props,
    jsonSecurityPulls,
    octokit,
    'discussion',
  );

  //git comments
  // try {
  //   const commitComments = await octokit.rest.repos.listCommitComments({
  //     owner: 'your-owner',
  //     repo: 'your-repo',
  //     ref: 'commit-hash', // Replace with the actual commit hash
  //   });
  //   console.log(commitComments.data); // Process the commit comments as needed
  // } catch (error) {

  // }

  return {
    jsonReviewComments,
    jsonDiscussionComments,
  };
}
