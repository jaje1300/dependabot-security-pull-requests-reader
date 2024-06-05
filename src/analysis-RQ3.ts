import { handleError, logLogs, logStats } from './log-service';
import { writeJsonFile } from './file-service';
import { PullsType, RepoType } from './octokit-service';
import { propsInitial, propsRefine, propsExclude } from './index.props';
import { RAPID_MERGE_TIME } from './constants';
import { filterByStatus, getPercentage } from './analysis-helper';
import {
  calculateTimeDifferenceInDays,
  getDecisionTimes,
} from './analysis-RQ1';
import { updateData } from './data-update-service';
import { readJsonFile } from './file-repository';

export function filterRapidMerges(
  dsprs: PullsType,
  timesMerged: any[],
  props: TypeProps,
  rapidMergeTime: number,
) {
  console.log(
    `[${props.id}-${props.dataset}] Classified RAPID MERGE TIME: ${rapidMergeTime} days or less`,
  );
  console.log(
    `[${props.id}-${props.dataset}] Filtering on MERGED dependabot security PRs`,
  );
  const dsprsMerged = filterByStatus(dsprs, 'MERGED');
  console.log(
    `[${props.id}-${props.dataset}] Filtering on RAPIDLY MERGED dependabot security PRs`,
  );
  const timesRapid = timesMerged.filter(
    (tm) => tm.timeDifference <= rapidMergeTime,
  );
  const dsprsRapid = dsprsMerged.filter((dspr) =>
    timesRapid.some(
      (tm) =>
        tm.dsprNumber === dspr.number &&
        //@ts-ignore
        tm.repoFullName === dspr.repoFullName,
    ),
  );
  const dsprsNotRapid = dsprsMerged.filter(
    (dspr) =>
      !timesRapid.some(
        (tm) =>
          tm.dsprNumber === dspr.number &&
          //@ts-ignore
          tm.repoFullName === dspr.repoFullName,
      ),
  );

  return { total: dsprsMerged, rapid: dsprsRapid, notRapid: dsprsNotRapid };
}

function filterFactorsPr(r3Rapid: TypeR3Rapid, props: TypeProps) {
  console.log(
    `[${props.id}-${props.dataset}] Filtering on PR Features for RAPIDLY MERGED dependabot security PRs`,
  );
  const autoMerge = r3Rapid.filter((rapid) => rapid.autoMerge === true);
  const autoMerge_False = r3Rapid.filter((rapid) => rapid.autoMerge === false);
  const changedLines = r3Rapid.filter((rapid) => rapid.changedLines > 0);
  const changedLines_0 = r3Rapid.filter((rapid) => rapid.changedLines === 0);

  // introduce thresholds for changed lines, like below 10, 20, 30, - 100, etc.
  const changedLines_2 = r3Rapid.filter((rapid) => rapid.changedLines <= 2);
  const changedLines_4 = r3Rapid.filter((rapid) => rapid.changedLines <= 4);
  const changedLines_8 = r3Rapid.filter((rapid) => rapid.changedLines <= 8);
  const changedLines_10 = r3Rapid.filter((rapid) => rapid.changedLines <= 10);
  const changedLines_20 = r3Rapid.filter((rapid) => rapid.changedLines <= 20);
  const changedLines_30 = r3Rapid.filter((rapid) => rapid.changedLines <= 30);
  const changedLines_50 = r3Rapid.filter((rapid) => rapid.changedLines <= 50);
  const changedLines_100 = r3Rapid.filter((rapid) => rapid.changedLines <= 100);

  return {
    r3Rapid: r3Rapid.length,
    autoMerge: autoMerge.length,
    autoMerge_False: autoMerge_False.length,
    changedLines: changedLines.length,
    changedLines_0: changedLines_0.length,
    percentages: {
      r3Rapid: getPercentage(r3Rapid.length, r3Rapid.length),
      autoMerge: getPercentage(autoMerge.length, r3Rapid.length),
      autoMergeFalse: getPercentage(autoMerge_False.length, r3Rapid.length),
      changedLines: getPercentage(changedLines.length, r3Rapid.length),
      changedLines_0: getPercentage(changedLines_0.length, r3Rapid.length),
      below: {
        changedLines_2: getPercentage(changedLines_2.length, r3Rapid.length),
        changedLines_4: getPercentage(changedLines_4.length, r3Rapid.length),
        changedLines_8: getPercentage(changedLines_8.length, r3Rapid.length),
        changedLines_10: getPercentage(changedLines_10.length, r3Rapid.length),
        changedLines_20: getPercentage(changedLines_20.length, r3Rapid.length),
        changedLines_30: getPercentage(changedLines_30.length, r3Rapid.length),
        changedLines_50: getPercentage(changedLines_50.length, r3Rapid.length),
        changedLines_100: getPercentage(
          changedLines_100.length,
          r3Rapid.length,
        ),
      },
    },
  };
}

function getPatchLevel(oldVersion: string, newVersion: string): string {
  const [oldMajor, oldMinor, oldPatch] = oldVersion.split('.').map(Number);
  const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

  if (newMajor > oldMajor) {
    return 'Major';
  } else if (newMinor > oldMinor) {
    return 'Minor';
  } else if (newPatch > oldPatch) {
    return 'Patch';
  } else {
    return 'Unknown';
  }
}

function addPatchLevel(r3Rapid: TypeR3Rapid, props = propsExclude) {
  /*
      patch_level: Dependabot includes the patch level of the dependency update in the title of the pull request it creates.
                   The title usually follows this format: Bump <dependency> from <old_version> to <new_version>.
    */
  const rapidWithPatchLevel = r3Rapid.map((rapidDSPR) => {
    const [oldVersion, newVersion] =
      rapidDSPR.title.match(/\d+\.\d+\.\d+/g) || [];
    let patchLevel = 'Unknown';
    if (oldVersion && newVersion) {
      patchLevel = getPatchLevel(oldVersion, newVersion);
    }
    return {
      ...rapidDSPR,
      patchLevel,
    };
  });

  return rapidWithPatchLevel;
}

function filterFactorsVul(r3Rapid: TypeR3Rapid, props = propsExclude) {
  //stats on severity and patch_level
  console.log(
    `[${props.id}-${props.dataset}] Filtering on Vulnerability Features for RAPIDLY MERGED dependabot security PRs`,
  );

  const unknown = r3Rapid.filter((rapid) => rapid.patchLevel === 'Unknown');
  const patch = r3Rapid.filter((rapid) => rapid.patchLevel === 'Patch');
  const minor = r3Rapid.filter((rapid) => rapid.patchLevel === 'Minor');
  const major = r3Rapid.filter((rapid) => rapid.patchLevel === 'Major');

  return {
    r3Rapid: r3Rapid.length,
    unknown: unknown.length,
    patch: patch.length,
    minor: minor.length,
    major: major.length,
    percentages: {
      r3Rapid: getPercentage(r3Rapid.length, r3Rapid.length),
      unknown: getPercentage(unknown.length, r3Rapid.length),
      patch: getPercentage(patch.length, r3Rapid.length),
      minor: getPercentage(minor.length, r3Rapid.length),
      major: getPercentage(major.length, r3Rapid.length),
    },
  };
}

async function addPercAccepted(
  r3Rapids: TypeR3Rapid,
  dsprs: PullsType,
  props = propsExclude,
) {
  /* 
      sloc: GitHub API does not provide this information. You would need to clone the repository and use a tool like cloc to count the lines of code.
      num_dependencies: GitHub API does not provide this information directly. You would need to parse the repository's package management files (package.json) at the time of PR creation.
      team_size: [MAYBE] Use octokit.repos.listCollaborators method to get a list of collaborators for a repository. However, this will give you the current collaborators, not the collaborators at the time of PR creation.
      num_PRs: Use octokit.pulls.list method to get a list of TOTAL pull requests for a repository, and then filter those that were created before the PR in question.
      num_submitted_PRs: [read meta.json and filter] for a repository, and then filter those that were created before the PR in question.
      (1) perc_accepted_PRs: Calculate the percentage of the filtered PRs (as described above) that have been merged.
      (3) num_recent_commits: Use octokit.repos.listCommits method to get a list of commits for a repository, and then filter those that were created in the month before the PR in question.
      age (days): [read active-repos.json created_at], and then calculate the age in days at the time of PR creation.
      num_issues: Use octokit.issues.listForRepo method to get a list of issues for a repository, and then filter those that were created before the PR in question.
    */

  // find perc_accepted_PRs using r3Rapid and dsprs (from meta.json)
  // 1. read dsprs and filter per repository (sort them into separate arrays)
  // 1.5 for each PR in r3Rapid, find the PRs in dsprs belonging to the corresponding repository
  // 2. then filter PRs that were created before the PR in question.
  // 3. Calculate the percentage of the filtered PRs (as described above) that have been merged
  // 4. Store results as 'perc_accepted_PRs'

  // Group PRs by repository
  const dsprsByRepo: Record<string, PullsType[]> = dsprs.reduce((acc, pr) => {
    // @ts-ignore
    if (!acc[pr.repoFullName]) {
      // @ts-ignore
      acc[pr.repoFullName] = [];
    }
    // @ts-ignore
    acc[pr.repoFullName].push(pr);
    return acc;
  }, {} as Record<string, PullsType[]>);

  // For each PR in r3Rapid, find the PRs in dsprs belonging to the corresponding repository
  const rapidWithPercAccepted: TypeR3Rapid = [];
  let log = '';
  for (const rapidDSPR of r3Rapids) {
    const repoDSPRs = dsprsByRepo[rapidDSPR.repoFullName];
    if (!repoDSPRs) {
      console.error(
        `[${props.id}-${props.dataset}] No PRs found for repository ${rapidDSPR.repoFullName}`,
      );
    }

    // Filter PRs that were created before the PR in question
    const priorDSPRs = repoDSPRs.filter(
      // @ts-ignore
      (repoDSPR) => repoDSPR.created_at < rapidDSPR.createdAt,
    );

    // Calculate the percentage of the filtered PRs that have been merged
    // TODO: take into account merged before the PR in question?
    // @ts-ignore
    const mergedPrs = filterByStatus(priorDSPRs, 'MERGED');
    let percAccepted = 0;
    const percentage = getPercentage(mergedPrs.length, priorDSPRs.length);
    if (percentage) {
      percAccepted = percentage;
    }

    // TODO log to file instead
    log += `[${props.id}-${props.dataset}] In ${rapidDSPR.repoFullName}, ${percAccepted}% of prior PRs have been accepted.\n`;
    //console.log(log);

    // Store results as 'percAccepted'
    rapidWithPercAccepted.push({
      ...rapidDSPR,
      percAccepted,
    });
  }

  await logStats(props, 'R3-percAccepted', log);

  return rapidWithPercAccepted;
}

function filterFactorsProject(r3Rapid: TypeR3Rapid, props = propsExclude) {
  console.log(
    `[${props.id}-${props.dataset}] Filtering on Project Features for RAPIDLY MERGED dependabot security PRs`,
  );

  const percAccepted = r3Rapid.filter((rapid) => rapid.percAccepted > 0);
  const percAccepted_0 = r3Rapid.filter((rapid) => rapid.percAccepted === 0);

  // introduce thresholds for accepted PRs, like below 10, 20, 30, - 100, etc.

  const percAccepted_10 = r3Rapid.filter((rapid) => rapid.percAccepted <= 10);
  const percAccepted_20 = r3Rapid.filter((rapid) => rapid.percAccepted <= 20);
  const percAccepted_30 = r3Rapid.filter((rapid) => rapid.percAccepted <= 30);
  const percAccepted_50 = r3Rapid.filter((rapid) => rapid.percAccepted <= 50);
  const percAccepted_60 = r3Rapid.filter((rapid) => rapid.percAccepted <= 60);
  const percAccepted_70 = r3Rapid.filter((rapid) => rapid.percAccepted <= 70);
  const percAccepted_80 = r3Rapid.filter((rapid) => rapid.percAccepted <= 80);
  const percAccepted_90 = r3Rapid.filter((rapid) => rapid.percAccepted <= 90);
  const percAccepted_100 = r3Rapid.filter((rapid) => rapid.percAccepted <= 100);

  return {
    r3Rapid: r3Rapid.length,
    percAccepted: percAccepted.length,
    percAccepted_0: percAccepted_0.length,
    percentages: {
      r3Rapid: getPercentage(r3Rapid.length, r3Rapid.length),
      percAccepted: getPercentage(percAccepted.length, r3Rapid.length),
      percAcceptedPrs_0: getPercentage(percAccepted_0.length, r3Rapid.length),
      below: {
        percAccepted_10: getPercentage(percAccepted_10.length, r3Rapid.length),
        percAccepted_20: getPercentage(percAccepted_20.length, r3Rapid.length),
        percAccepted_30: getPercentage(percAccepted_30.length, r3Rapid.length),
        percAccepted_50: getPercentage(percAccepted_50.length, r3Rapid.length),
        percAccepted_60: getPercentage(percAccepted_60.length, r3Rapid.length),
        percAccepted_70: getPercentage(percAccepted_70.length, r3Rapid.length),
        percAccepted_80: getPercentage(percAccepted_80.length, r3Rapid.length),
        percAccepted_90: getPercentage(percAccepted_90.length, r3Rapid.length),
        percAccepted_100: getPercentage(
          percAccepted_100.length,
          r3Rapid.length,
        ),
      },
    },
  };
}

export async function analyseRQ3(dsprs: PullsType, props = propsExclude) {
  console.log('[analyseRQ3] props:', props.analyse);
  try {
    // ************* RQ3: What factors are associated with rapid merge times?
    const timesMerged = await getDecisionTimes(dsprs, 'MERGED', props);

    const rq3 = filterRapidMerges(dsprs, timesMerged, props, RAPID_MERGE_TIME);
    console.log(
      `[${props.id}-${props.dataset}] Counting RAPIDLY MERGED dependabot security PRs`,
    );
    const resultRQ3_Amounts = {
      total: rq3.total.length,
      rapid: rq3.rapid.length,
      notRapid: rq3.notRapid.length,
      percentages: {
        total: getPercentage(rq3.total.length, rq3.total.length),
        rapid: getPercentage(rq3.rapid.length, rq3.total.length),
        notRapid: getPercentage(rq3.notRapid.length, rq3.total.length),
      },
    };
    await writeJsonFile(props, 'RQ3-rapid-merge-times', [resultRQ3_Amounts]);

    console.log(
      `[${props.id}-${props.dataset}] Analysing RAPIDLY MERGED dependabot security PRs`,
    );
    // TODO: PERFORM ANALYSIS on the factors associated with rapid merge times.
    // Collect and check attributes within 3 sets of Features: "PR", "Project", and "Vulnerability Patch"
    //PR Features: changed_lines, auto_merge
    /*
      [x](11) changed_lines Numeric Number of lines changed (added + deleted) in the dependency file by Dependabot PR
      [x](2) auto_merge Category Status of auto-merge method for Dependabot PR. Binary value: True or False
    */
    console.log(
      `[${props.id}-${props.dataset}] Getting PR Features, present in RAPIDLY MERGED dependabot security PRs`,
    );
    if (!props.analyse.readFromCache) {
      await updateData(props); // fetches 'changedLines', updates and writes to updated-rapid-dsprs.json
    }
    const rapidDSPRs = await readJsonFile(props, 'updated-rapid-dsprs'); // contains extra attributes
    const r3Rapid = rapidDSPRs.map((dspr) => ({
      dsprNumber: dspr.number,
      repoFullName: dspr.repoFullName,
      changedLines: dspr.changedLines,
      autoMerge: dspr.auto_merge === null ? false : true, // auto_merge is an object
      mergeTime:
        dspr.created_at && dspr.merged_at
          ? calculateTimeDifferenceInDays(dspr.created_at, dspr.merged_at)
          : 0,
      title: dspr.title,
      createdAt: dspr.created_at,
      mergedAt: dspr.merged_at,
    }));
    //sort r3Rapid on mergeTime. (The idea is: the fewer changedLines, the faster the mergeTime)
    r3Rapid.sort((a, b) => a.mergeTime - b.mergeTime);
    const r3RapidUpdated = r3Rapid.map((dspr) => ({
      ...dspr,
      percAccepted: 0, // adds placeholder percAccepted for typings
    }));

    const r3RapidPercAccepted = await addPercAccepted(
      r3RapidUpdated,
      dsprs,
      props,
    ); // adds percAccepted to r3Rapid (used for project features)
    const r3RapidPercAcceptedPatch = addPatchLevel(r3RapidPercAccepted, props); // adds patchLevel to r3Rapid (used for vulnerability patch features)
    await writeJsonFile(props, 'RQ3-rapid-dsprs', r3RapidPercAcceptedPatch);

    // check availability of features
    const resultRQ3_PR_Factors = filterFactorsPr(r3RapidUpdated, props);
    await writeJsonFile(props, 'RQ3-rapid-merge-factors-pr', [
      resultRQ3_PR_Factors,
    ]);

    console.log(
      `[${props.id}-${props.dataset}] Checking Project Features, present in RAPIDLY MERGED dependabot security PRs`,
    );
    // Vulnerability Patch Features: severity, patch_level
    /*
      (7) severity Category Severity of the vulnerability in the affected dependency (Critical, High, Moderate, Low) associated with the Dependabot PR
      [x](8) patch_level Category Patch level of the dependency update (Major, Minor, Patch) associated with the Dependabot PR
    */

    const resultRQ3_Vul_Factors = filterFactorsVul(
      r3RapidPercAcceptedPatch,
      props,
    );
    await writeJsonFile(props, 'RQ3-rapid-merge-factors-vul', [
      resultRQ3_Vul_Factors,
    ]);

    // Project Features: sloc, team_size, num_submitted_PRs, perc_accepted_PRs, num_dependencies, num_recent_commits, age (days), num_issues, num_PRs
    //TODO: lookup from active-repos.json?
    /*
      (6) sloc Numeric Number of executable source lines of code in the project at Dependabot PR creation time
      (4) num_dependencies Numeric Number of total project dependencies at the PR creation time
      (13) team_size Numeric Number of the active team members in the project at the PR creation time
      (9) num_PRs Numeric Number of total project PRs at the PR creation time
      (10) num_submitted_PRs Numeric Number of submitted Dependabot security PRs to the project at the PR creation time
      [x](1) perc_accepted_PRs Numeric Percentage of merged Dependabot security PRs in the project at the PR creation time
      [](3) num_recent_commits Numeric Number of commits in the project during the last month prior to the PR creation time
      ((5)) age (days) Numeric Project age at Dependabot PR creation time (i.e., the time interval between project creation time and Dependabot PR creation time)
      (12) num_issues Numeric Number of total project issues at the PR creation time
    */

    const resultRQ3_Project_Factors = filterFactorsProject(
      r3RapidPercAcceptedPatch,
      props,
    );
    await writeJsonFile(props, 'RQ3-rapid-merge-factors-proj', [
      resultRQ3_Project_Factors,
    ]);
  } catch (error) {
    handleError(props, error, 'analyse-RQ3');
  }
}

//analyseRQ3().catch(console.error);
