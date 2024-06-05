import { getActiveRepos } from './octo-repo-service';
import {
  Octokit,
  DiscussionCommentsType,
  PullsType,
  RepoType,
  ReviewCommentsType,
} from './octokit-service';
import { writeJsonFile } from './file-service';
import { readJsonFile } from './file-repository';
import { getSecurityPulls } from './octo-pull-service';
import { logLogs } from './log-service';
import { getComments } from './octo-comment-service';
import { prStatus } from './transformation-helper';

const getActiveRepositories = async (props: TypeProps, myOctokit: Octokit) => {
  let activeRepos: RepoType = [];
  if (!props.repos.readFromCache) {
    // has to be more than 1000?!?! octokit.search.repos.all({ q }) was from wrapper simple-octokit...
    activeRepos = await getActiveRepos(props, myOctokit); // get commits for the count?
    await writeJsonFile(props, 'active-repos', activeRepos); // get commit comments too? if so then we need commits?
    // can we use octokit.projects.listForRepo(options) and get commits from there? probly not, from wrapper simple-octokit..
  } else {
    console.log('Reading repos from cache...');
    activeRepos = await readJsonFile(props, 'active-repos');
  }
  return activeRepos; // as RepoType;
};

const getDSPRs = async (
  props: TypeProps,
  activeRepos: RepoType,
  myOctokit: Octokit,
) => {
  let securityPulls: PullsType = [];
  if (!props.pulls.readFromCache) {
    securityPulls = await getSecurityPulls(props, activeRepos, myOctokit);
    await writeJsonFile(props, props.dataset.toLowerCase(), securityPulls);
  } else {
    console.log('Reading pulls from cache...');
    securityPulls = await readJsonFile(props, props.dataset.toLowerCase());
  }

  const logFoundSecurityPRsTotal = `[${props.id}-${props.dataset}]  Found ${securityPulls.length} dependabot security PRs in total \n\n`;
  await logLogs(props, 'found-security-pulls-total', logFoundSecurityPRsTotal);
  return securityPulls; // as PullsType;
};

//TODO: Refactor to use the same function for both review and discussion comments
const getCommentsForDSPRs = async (
  props: TypeProps,
  dsprs: PullsType,
  myOctokit: Octokit,
  dsprStatus: TypeDsprStatus = 'NOT_MERGED',
) => {
  let comments = {
    jsonReviewComments: [] as ReviewCommentsType,
    jsonDiscussionComments: [] as DiscussionCommentsType,
  };
  console.log(
    `[${props.id}-${props.dataset}] Filtering on ${dsprStatus} dependabot security PRs...`,
  );
  const notMergedDsprs = dsprs.filter((dspr) => prStatus(dspr) === dsprStatus);
  console.log(
    `[${props.id}-${props.dataset}] Filtered ${notMergedDsprs.length} ${dsprStatus} dependabot security PRs`,
  );

  console.log(`Getting comments for  ${dsprStatus} PRs...`);

  if (props.comments.includeComments) {
    if (!props.comments.readFromCache) {
      //TODO  attach dspr number or id to comments to link them?
      //dspr.clean_url and comment.cleanUrl should already match (both are issues urls)
      const comments = await getComments(props, notMergedDsprs, myOctokit);
      await writeJsonFile(
        props,
        'review-comments',
        comments.jsonReviewComments,
      );
      await writeJsonFile(
        props,
        'discussion-comments',
        comments.jsonDiscussionComments,
      );
    } else {
      console.log('Reading comments from cache...');
      comments.jsonReviewComments = await readJsonFile(
        props,
        'review-comments',
      );
      comments.jsonDiscussionComments = await readJsonFile(
        props,
        'discussion-comments',
      );
    }
  }
  // exclude PRs  without discussion or review comments from analysis of NOT_MERGED PRs

  return {
    reviewComments: comments.jsonReviewComments,
    discussionComments: comments.jsonDiscussionComments,
  };
};

export { getActiveRepositories, getDSPRs, getCommentsForDSPRs };
