import { Octokit, RepoType, handleRateLimit } from './octokit-service';
import { handleError, logLogs } from './log-service';

// Helper function to handle pagination and rate limiting
export const getRepos = async (props: TypeProps, octokit: Octokit) => {
  const repos: RepoType = [];
  let logTotal = '';
  let count = 0;

  try {
    // Your code for getting the active repos goes here
    for await (const response of octokit.paginate.iterator(
      octokit.search.repos,
      props.repos.params,
    )) {
      repos.push(...response.data);
      const logReposPagination = `[${props.id}-${props.dataset}] Found ${response.data.length} repos`;
      console.log(logReposPagination);
      logTotal += `${logReposPagination}\n`;
      //add one count
      count++;

      await handleRateLimit(octokit);
    }
  } catch (error) {
    handleError(props, error, `repos-${count}`);
    await handleRateLimit(octokit);
  }
  await logLogs(props, 'repos', logTotal);

  return repos;
};
