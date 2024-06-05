import * as stats from 'stats-lite';
import { handleError, logLogs } from './log-service';
import { writeJsonFile } from './file-service';
import { PullsType, RepoType } from './octokit-service';
import { propsInitial, propsRefine, propsExclude } from './index.props';
import { filterByStatus, getPercentage } from './analysis-helper';

export function calculateTimeDifferenceInDays(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDifference = endDate.getTime() - startDate.getTime();
  return timeDifference / (1000 * 60 * 60 * 24);
}

async function logDecisionTimes(
  res: any[],
  status: TypeDsprStatus,
  props: TypeProps,
) {
  let logTimeDifferenceTotal = '';
  for (const r of res) {
    const logString = `[analyseData] RQ1: Time to reach status ${r.status} PR ${r.dsprNumber} is ${r.timeDifference} days`;
    //console.log(logString);
    logTimeDifferenceTotal += logString + '\n';
  }

  await logLogs(props, `time-to-${status}`, logTimeDifferenceTotal);
}

export async function getDecisionTimes(
  dsprs: PullsType,
  status: TypeDsprStatus,
  props: TypeProps,
): Promise<TypeDecisionTimes> {
  console.log(
    `[${props.id}-${props.dataset}] Analysing how long it take to reach status ${status} on DSPRs...`,
  );
  const filteredDsprs = filterByStatus(dsprs, status);
  const result = [];
  try {
    for (const dspr of filteredDsprs) {
      let timeDifferenceInDays = 0;
      if (dspr.created_at && dspr.merged_at) {
        timeDifferenceInDays = calculateTimeDifferenceInDays(
          dspr.created_at,
          dspr.merged_at,
        );
      }
      if (dspr.created_at && dspr.closed_at) {
        timeDifferenceInDays = calculateTimeDifferenceInDays(
          dspr.created_at,
          dspr.closed_at,
        );
      }
      if (dspr.created_at && !dspr.merged_at && !dspr.closed_at) {
        console.log(
          `[${props.id}-${props.dataset}] NO merged_at or closed_at date found for PR ${dspr.number}`,
        );
      } else {
        // console.log(
        //   `[analyseData] RQ1: Time to reach status ${status} PR ${dspr.number} is ${timeDifferenceInDays} days`,
        // );
      }
      const res = {
        dsprNumber: dspr.number,
        timeDifference: timeDifferenceInDays,
        status: status,
        //@ts-ignore
        repoFullName: dspr.repoFullName,
      };
      result.push(res);
    }
  } catch (error) {
    handleError(props, error, 'analyse-data-decision-time');
  }
  // sort resultRQ1 by time To decision
  result.sort((a, b) => a.timeDifference - b.timeDifference);
  await logDecisionTimes(result, status, props);
  return result;
}

function analyseDecisionTimes(decisionTimes: { timeDifference: number }[]) {
  // analyse time to decision (find median, mean, max, min, etc.)
  const filteredTimes = decisionTimes
    .map((dt) => dt.timeDifference)
    .filter(Boolean);

  const mean = stats.mean(filteredTimes);
  const median = stats.median(filteredTimes);
  const max = Math.max(...filteredTimes);
  const min = Math.min(...filteredTimes);

  return {
    mean,
    median,
    max,
    min,
  };
}

export async function analyseRQ1(dsprs: PullsType, props = propsExclude) {
  console.log('[analyseRQ1] props:', props.analyse);
  try {
    //  ************* RQ1: How often and how fast are Dependabot security pull requests merged?

    console.log(
      `[${props.id}-${props.dataset}] Read ${dsprs.length} CLOSED (for Meta) dependabot security PRs in total`,
    );
    // 1.1) how long does it take to merge (MERGED) a security PR since it was first created?
    const timesMerged = await getDecisionTimes(dsprs, 'MERGED', props);
    await writeJsonFile(props, 'RQ1-1-time-to-merge', timesMerged);
    const timesNotMerged = await getDecisionTimes(dsprs, 'NOT_MERGED', props);
    await writeJsonFile(props, 'RQ1-2-time-to-not-merge', timesNotMerged);

    // 1.1.1) How many Dependabot security PRs are merged (accepted)
    const amounts = {
      total: dsprs.length,
      merged: timesMerged.length,
      notMerged: timesNotMerged.length,
    };
    const percentages = {
      total: getPercentage(amounts.total, amounts.total),
      merged: getPercentage(amounts.merged, amounts.total),
      notMerged: getPercentage(amounts.notMerged, amounts.total),
    };
    // 1.1.2) How long does it take for these security PRs to be MERGED?
    // 1.2) how long does it take to close (NOT_MERGED) a security PR since it was first created?
    const decisionTimes = {
      merged: analyseDecisionTimes(timesMerged),
      notMerged: analyseDecisionTimes(timesNotMerged),
    };

    //RQ1 - combined results
    const resultRQ1 = {
      amounts,
      percentages,
      decisionTimes,
    };
    await writeJsonFile(props, 'RQ1-time-to-decide', [resultRQ1]);
  } catch (error) {
    handleError(props, error, 'analyse-RQ1');
  }
}

//analyseRQ1().catch(console.error);
