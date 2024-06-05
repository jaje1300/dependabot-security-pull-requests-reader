import { handleError, logLogs, logStats } from './log-service';
import { Octokit, PullsType, RepoType } from './octokit-service';
import { getPull, getPulls } from './octo-pull-repository';
import { count } from 'console';

const processPulls = (props: TypeProps, pulls: any[], repo: any) => {
  try {
    return pulls
      .filter(
        (pull) =>
          pull.body?.includes('security') &&
          pull.body.includes('bump') && // Dependabot usually says "bump" in the PRs
          pull.body.includes('from') &&
          pull.body.includes('to'),
      )
      .map((dspr) => {
        return { ...dspr, repoFullName: repo.full_name }; // carry the repo_full name to use as repository_url_short
      });
    // Rest of the code...
  } catch (error) {
    handleError(props, error, 'process-pulls');
    return [];
  }
};

export async function getSecurityPulls(
  props: TypeProps,
  activeRepos: RepoType,
  octokit: Octokit,
) {
  const jsonSecurityPulls: PullsType = [];
  let logTotal = '';
  let logFoundSecurityPRsRepos = '';
  let countSecurityPrs = 0;
  let count = 0;
  try {
    for (const repo of activeRepos) {
      count++;
      console.time(`Get pulls ${count}`);
      if (props.testRun) {
        if (repo.full_name != 'nodejs/node') {
          continue; // for testing purposes, first repo with dspr & comments
        }
      }
      // Get pull requests authored by Dependabot
      const pulls = await getPulls(props, repo, octokit);
      const logFoundPullsAll = `[${props.id}-${props.dataset}] Found ${pulls.length} pulls total, authored by dependabot in repo ${repo.full_name}\n`;
      console.log(logFoundPullsAll);

      // Filter out PRs that don't look like security patches
      const securityPulls = processPulls(props, pulls, repo);
      const logFoundSecurityPRs = `[${props.id}-${props.dataset}] Found ${securityPulls.length} dependabot Security PRs in repo ${repo.full_name}\n`;
      console.log(logFoundSecurityPRs);

      logTotal += `${logFoundPullsAll} \n${logFoundSecurityPRs} \n \n`;

      // if we found any hits, add to total
      if (securityPulls?.length) {
        jsonSecurityPulls.push(...securityPulls); // HERE we copy into total array jsonSecurityPulls
        logFoundSecurityPRsRepos += `${logFoundSecurityPRs} \n`;
        countSecurityPrs += securityPulls.length;
      }

      if (props.testRun) {
        if (securityPulls?.length) {
          break; // troubleshoot, first dspr repo with comments
        }
      }

      console.timeEnd(`Get pulls ${count}`);
      console.log('\n');
    }
  } catch (error) {
    await handleError(props, error, `security-pulls-${count}`);
  }

  await logLogs(props, 'found-security-pulls', logFoundSecurityPRsRepos);
  await logLogs(props, 'found-pulls-and-dspr', logTotal);
  await logStats(props, 'count-dspr', countSecurityPrs.toString());
  return jsonSecurityPulls;
}

export const updatePulls = async (
  props: TypeProps,
  rapidPulls: PullsType,
  octokit: Octokit,
) => {
  let count = 0;
  const rapidChangedLines = [];
  try {
    for (const dspr of rapidPulls) {
      count++;
      const pull = await getPull(
        props,
        //@ts-ignore
        dspr.repoFullName,
        dspr.number,
        octokit,
      );
      if (pull) {
        const changedLines = pull.additions + pull.deletions;
        console.log(
          `[${props.id}-${props.dataset}] changed_lines for PR ${dspr.number}: ${changedLines}`,
        );
        const res = {
          ...dspr,
          dsprNumber: dspr.number,
          changedLines,
          additions: pull.additions,
          deletions: pull.deletions,
        };
        rapidChangedLines.push(res);
      }
    }
  } catch (error) {
    await handleError(props, error, `update-pulls-${count}`);
  }
  return rapidChangedLines;
};
