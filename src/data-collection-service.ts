import { handleError } from './log-service';
import { Octokit, PullsType, RepoType, getMyOctokit } from './octokit-service';
import {
  getActiveRepositories,
  getCommentsForDSPRs,
  getDSPRs,
} from './index.repository';
import { propsInitial, propsRefine, propsExclude } from './index.props';

export async function collectData(props = propsExclude) {
  const myOctokit = getMyOctokit();

  console.log('[collectData] props:', props);
  try {
    console.time('[collectData] Total process time');

    console.time('Getting the active repos');
    const activeRepos: RepoType = await getActiveRepositories(props, myOctokit);
    console.log(`[collectData] Found ${activeRepos.length} active repos`);
    console.timeEnd('Getting the active repos');

    console.time('Getting the security pulls');
    const dsprs: PullsType = await getDSPRs(props, activeRepos, myOctokit);
    console.log(`[collectData] Found ${dsprs.length} dependabot security PRs`);
    console.timeEnd('Getting the security pulls');

    console.time('Getting the comments');
    const comments = await getCommentsForDSPRs(props, dsprs, myOctokit);
    console.log(
      `[collectData] Found ${
        comments.reviewComments.length + comments.discussionComments.length
      } comments in total`,
    );
    console.log(
      `[collectData] Found ${comments.reviewComments.length} review comments`,
    );
    console.log(
      `[collectData] Found ${comments.discussionComments.length} discussion comments`,
    );
    console.timeEnd('Getting the comments');

    console.timeEnd('[collectData] Total process time');

    console.log('\n');
  } catch (error) {
    handleError(props, error, 'collect-data');
  }
}

//collectData().catch(console.error);
