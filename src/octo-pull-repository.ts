import { Octokit, handleRateLimit } from './octokit-service';
import { handleError, logLogs } from './log-service';

// Helper function to handle pagination and rate limiting
export const getPulls = async (
  props: TypeProps,
  repo: any,
  octokit: Octokit,
) => {
  const pulls = [];
  let logTotal = '';
  let count = 0;
  try {
    for await (const response of octokit.paginate.iterator(octokit.pulls.list, {
      owner: repo.owner.login,
      repo: repo.name,
      ...props.pulls.params,
    })) {
      pulls.push(...response.data);
      const logPullsPagination = `[${props.id}-${props.dataset}] Found ${response.data.length} pulls, authored by dependabot, in repo ${repo.name}`;
      console.log(logPullsPagination);
      logTotal += `${logPullsPagination}\n`;

      count++;
      if (props.testRun && count > 100) {
        // TEST RUN
        // should be in first batch? try lowering the count? 20 didn't work
        console.log('pulls, count above 100');
        const res = pulls.filter(
          (pull) =>
            pull.body?.includes('security') &&
            pull.body.includes('bump') &&
            pull.body.includes('from') &&
            pull.body.includes('to'),
        );
        // make sure its dspr, not just any pull
        if (res.length > 0) {
          console.log('pulls, found dspr, breaking early');
          break; // troubleshoot, first dspr pull with comments...
        }
      }
      await handleRateLimit(octokit);
    }
  } catch (error) {
    handleError(props, error, `pulls-${repo.name}-${count}`);
    await handleRateLimit(octokit);
  }
  await logLogs(props, 'get-pulls', logTotal);
  return pulls;
};

export const getPull = async (
  props: TypeProps,
  repoFullName: string,
  pullNumber: number,
  octokit: Octokit,
) => {
  try {
    const pull = await octokit.pulls.get({
      owner: repoFullName.split('/')[0],
      repo: repoFullName.split('/')[1],
      pull_number: pullNumber,
    });
    return pull.data;
  } catch (error) {
    handleError(props, error, `pull-${repoFullName}-${pullNumber}`);
    await handleRateLimit(octokit);
  }
};
