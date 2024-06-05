import { Octokit, RepoType } from './octokit-service';
import { handleError, logLogs, logStats } from './log-service';
import { getRepos } from './octo-repo-repository';

export async function getActiveRepos(
  props: TypeProps,
  octokit: Octokit,
): Promise<RepoType> {
  const activeRepos: RepoType = [];

  let logFoundCommits = '';

  let count = 0;
  try {
    console.time('Getting the repos');
    // Get initial/total JavaScript repositories (up to 1000?)
    const repos = await getRepos(props, octokit);
    console.timeEnd('Getting the repos');

    const logFoundInitialRepo = `[${props.id}-${props.dataset}] Found ${repos.length} repos Initially \n\n`;
    await logLogs(props, 'initial-repos', logFoundInitialRepo);

    // turn into function to retrieve active repos ("projects") and store them as json
    for (const repo of repos) {
      count++;
      console.time(`Getting active repos ${count}`);
      if (props.testRun) {
        if (repo.full_name != 'nodejs/node') {
          continue; // for testing purposes, first repo with dspr & comments
        }
      }

      try {
        // Filter repositories with more than x commits (20 refined & meta)
        const { data: commits } = await octokit.repos.listCommits({
          // @ts-ignore
          owner: repo.owner.login, //possibly null
          repo: repo.name,
          per_page: 21, // only need 21, for the refined filter
        });
        logFoundCommits += `[${props.id}-${props.dataset}] Found ${commits.length} commits, on repo ${repo.name}\n`;
        console.log(logFoundCommits);

        if (commits.length >= props.repos.commits.minimum) {
          activeRepos.push(repo);
        }
      } catch (error) {
        handleError(props, error, `commits-${repo.name}-${count}`);
      }

      console.timeEnd(`Getting active repos ${count}`);
    }
    const logReposTotal = `[${props.id}-${props.dataset}] Found ${activeRepos.length} active repos in total`;
    console.log(logReposTotal);
    await logStats(props, 'total-repos', logReposTotal);
  } catch (error) {
    await handleError(props, error, `active-repos-${count}`);
  }
  await logLogs(props, 'found-commits', logFoundCommits);

  return activeRepos;
}
