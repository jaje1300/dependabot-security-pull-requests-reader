import { handleError, logLogs } from './log-service';
import {
  readJsonComments,
  readJsonDataset,
  writeJsonFile,
} from './file-service';
import { DiscussionCommentsType, ReviewCommentsType } from './octokit-service';
import { propsInitial, propsRefine, propsExclude } from './index.props';
import { readJsonFile, writeToFolder } from './file-repository';
import { getPercentage } from './analysis-helper';

type TypeCombinedComments = {
  reviewComments: ReviewCommentsType;
  discussionComments: DiscussionCommentsType;
};

type TypeCommentsByPr = Record<
  string,
  (DiscussionCommentsType | ReviewCommentsType)[]
>;

//type TypeFinalCommentsByPr = [{ [key: string]: TypeCommentsByPr }];
//type TypeFinalCommentsByPr = TypeCommentsByPr[];

function groupCommentByCleanUrl(
  comment: DiscussionCommentsType | ReviewCommentsType,
) {
  // @ts-ignore
  console.log('groupCommentByCleanUrl comment.cleanUrl:', comment.cleanUrl);
  const commentsByPr: TypeCommentsByPr = {};
  // @ts-ignore
  if (!commentsByPr[comment.cleanUrl]) {
    // @ts-ignore
    commentsByPr[comment.cleanUrl] = []; // initialize key
  }
  // @ts-ignore
  commentsByPr[comment.cleanUrl].push(comment);
  return {
    ...commentsByPr,
    // @ts-ignore
    [comment.cleanUrl]: [...(commentsByPr[comment.cleanUrl] || []), comment],
  };
}

function groupCommentsByPr(comments: TypeCombinedComments) {
  console.log(
    'comments.reviewComments length:',
    comments.reviewComments.length,
  );
  console.log(
    'comments.discussionComments length:',
    comments.discussionComments.length,
  );
  const rc = comments.reviewComments.map((comment) => {
    // @ts-ignore
    return groupCommentByCleanUrl(comment);
  });
  const dc = comments.discussionComments.map((comment) => {
    // @ts-ignore
    return groupCommentByCleanUrl(comment);
  });
  console.log('rc length:', rc.length);
  console.log('rc [0]:', rc[0]);
  console.log('dc length:', dc.length);
  console.log('dc [0]:', dc[0]);

  // reduce rc and dc to a single array containing both review comments and discussion comments
  const commentsByPr: TypeCommentsByPr = {};
  rc.forEach((comment) => {
    // @ts-ignore
    console.log('groupCommentsByPr rc comment.cleanUrl:', comment.cleanUrl);
    // @ts-ignore
    if (!commentsByPr[comment.cleanUrl]) {
      // @ts-ignore
      commentsByPr[comment.cleanUrl] = [];
    }
    // @ts-ignore
    commentsByPr[comment.cleanUrl].push(comment);
  });

  dc.forEach((comment) => {
    // @ts-ignore
    console.log('groupCommentsByPr dc comment.cleanUrl:', comment.cleanUrl);
    // @ts-ignore
    if (!commentsByPr[comment.cleanUrl]) {
      // @ts-ignore
      commentsByPr[comment.cleanUrl] = [];
    }
    // @ts-ignore
    commentsByPr[comment.cleanUrl].push(comment);
  });

  // log length for all keys in commentsByPr
  console.log('commentsByPr length:', Object.keys(commentsByPr).length);
  //console.log('commentsByPr undefined main key?:', commentsByPr); // *************************************commentsByPr undefined key?

  //return commentsByPr;
  const res = commentsByPr['undefined'];

  console.log('commentsByPr res length:', Object.keys(res).length);
  //console.log('commentsByPr res: ', res);

  return res;
}

async function troubleshooting(props: any, prCommentsValuesPopped: any[]) {
  //const pathFolder = `src/data/dataset/${props.id}/troubleshooting`;
  //console.log('prCommentsValuesPopped:', prCommentsValuesPopped);
  // await writeToFolder(
  //   `${pathFolder}/RQ2-prCommentsValuesPopped-${prUrl}.json`,
  //   JSON.stringify(prCommentsValuesPopped),
  //   pathFolder,
  // );
}

function getReasonsForClosure(prCommentsValuesPopped: any[], props: TypeProps) {
  const reasonsForClosure = prCommentsValuesPopped.map((comment: any) => {
    console.log(
      `[${props.id}-${props.dataset}] first 100 from comment body for ${
        comment.cleanUrl
      }: ${comment.body.substring(0, 100)}`,
    );

    const r1Condition = (body: string) => {
      return (
        body.includes(
          'pull request has been closed because it was superseded by',
        ) ||
        body.includes('Superseded') ||
        body.includes('superseded')
      );
    };
    const r2Condition = (body: string) => {
      return (
        body.includes(
          'pull request is no longer needed because the dependency is already up to date',
        ) ||
        body.includes('Up to date') ||
        body.includes('up to date') ||
        body.includes('No longer needed') ||
        body.includes('no longer needed') ||
        body.includes('already up to date')
      );
    };
    const r3Condition = (body: string) => {
      return (
        body.includes('dependency is no longer used in the project') ||
        body.includes('No longer a dependency') ||
        (body.includes('dependency') && body.includes('removed')) ||
        body.includes('no longer used')
      );
    };
    const r4Condition = (body: string) => {
      return (
        body.includes(
          'dependency cannot be updated because it has a peer requirement on another dependency that is not met by this update',
        ) ||
        body.includes('Not updateable') ||
        body.includes('not updateable') ||
        body.includes('peer requirement') ||
        body.includes('not met by this update')
      );
    };
    const r5Condition = (body: string) => {
      return (
        body.includes('tests failed after updating this dependency') ||
        ((body.includes('Test') || body.includes('test')) &&
          body.includes('failed'))
      );
    };
    const r6Condition = (body: string) => {
      return (
        body.includes(
          'an error in the implementation of the dependency update in this pull request',
        ) ||
        body.includes('Error') ||
        body.includes('error')
      );
    };
    const r7Condition = (body: string) => {
      return (
        body.includes(
          `pull request does not meet the projects quality standards for handling pull requests`,
        ) ||
        body.includes('Quality') ||
        body.includes('quality') //&&
        //(body.includes('not meet') || body.includes('not met'))
      );
    };

    if (r1Condition(comment.body)) {
      return 'R1 Superseded'; //  A newer PR contains a newer fix version of the affected dependency
    } else if (r2Condition(comment.body)) {
      return 'R2 Up to date'; // The affected dependency is already updated
    } else if (r3Condition(comment.body)) {
      return 'R3 No longer a dependency'; // The affected dependency is removed
    } else if (r4Condition(comment.body)) {
      return 'R4 No longer updatable'; // The affected dependency has a peer requirement on another dependency
    } else if (r5Condition(comment.body)) {
      return 'R5 Tests'; // Tests run failed
    } else if (r6Condition(comment.body)) {
      return 'R6 Errors'; // Incorrect implementation for handling the dependency fix in the PR
    } else if (r7Condition(comment.body)) {
      return 'R7 Quality Requirement'; // The PR does not comply to the project standards for handling the PRs
    } else {
      // 'Default' or 'Other' or 'Not classified' or 'Not categorized' or 'Not specified' or 'Not provided' or 'Not mentioned' or 'Not found' or 'Not available'
      return 'R8 Unknown'; //The PR could not be classified due to lack of information in the discussion
    }
  });
  return reasonsForClosure;
}

function filterReasons(analysis: any[], props = propsExclude) {
  console.log(
    `[${props.id}-${props.dataset}] Filtering on Reasons for NOT MERGING dependabot security PRs`,
  );

  // {
  //   cleanUrl: key, // Extract project name from PR URL
  //   index: index, // Extract PR number from PR URL
  //   closureDate: undefined, // TODO: Replace with actual closure date from DSPR data *************************************** update needed
  //   reasonsForClosure: reasonsForClosure, // .join(', '),
  //   additionalNotes: '', // TODO: Add any additional notes as needed
  //   additionalComments: '', // TODO: Add any additional comments as needed
  //   amountOfComments: prCommentsValuesPopped.length,
  // }

  const reasonsCount = analysis.reduce((acc, item) => {
    item.reasonsForClosure.forEach((reason: string) => {
      if (!acc[reason]) {
        acc[reason] = 1;
      } else {
        acc[reason]++;
      }
    });
    return acc;
  }, {});

  console.log('reasonsCount', reasonsCount);

  type TypeReasonsCountWithUnderscores = {
    R8_Unknown: number;
    R1_Superseded: number;
    R2_Up_to_date: number;
    R6_Errors: number;
    R5_Tests: number;
    R3_No_longer_a_dependency: number;
    R7_Quality_Requirement: number;
    R4_No_longer_updatable: number;
  };
  const reasons = Object.keys(reasonsCount).reduce((acc, key) => {
    const newKey = key.replace(/ /g, '_');
    //@ts-ignore
    acc[newKey] = reasonsCount[key];
    return acc;
  }, {});

  console.log('reasons', reasons);

  if (!reasons.hasOwnProperty('R1_Superseded')) {
    //@ts-ignore
    reasons.R1_Superseded = undefined;
  }
  if (!reasons.hasOwnProperty('R2_Up_to_date')) {
    //@ts-ignore
    reasons.R2_Up_to_date = undefined;
  }
  if (!reasons.hasOwnProperty('R3_No_longer_a_dependency')) {
    //@ts-ignore
    reasons.R3_No_longer_a_dependency = undefined;
  }
  if (!reasons.hasOwnProperty('R4_No_longer_updatable')) {
    //@ts-ignore
    reasons.R4_No_longer_updatable = undefined;
  }
  if (!reasons.hasOwnProperty('R5_Tests')) {
    //@ts-ignore
    reasons.R5_Tests = undefined;
  }
  if (!reasons.hasOwnProperty('R6_Errors')) {
    //@ts-ignore
    reasons.R6_Errors = undefined;
  }
  if (!reasons.hasOwnProperty('R7_Quality_Requirement')) {
    //@ts-ignore
    reasons.R7_Quality_Requirement = undefined;
  }
  if (!reasons.hasOwnProperty('R8_Unknown')) {
    //@ts-ignore
    reasons.R8_Unknown = undefined;
  }
  console.log(
    '[filterReasons] reasons after inserting missing properties: ',
    reasons,
  );

  // introduce thresholds for ...?
  // count all reasonsForClosure
  const allReasons = analysis.flatMap((a) => a.reasonsForClosure);
  console.log('analysis length:', analysis.length);
  console.log('allReasons length:', allReasons.length);

  return {
    allReasons: allReasons.length,
    //@ts-ignore
    R1_Superseded: reasons.R1_Superseded,
    //@ts-ignore
    R2_Up_to_date: reasons.R2_Up_to_date,
    //@ts-ignore
    R3_No_longer_a_dependency: reasons.R3_No_longer_a_dependency || undefined,
    //@ts-ignore
    R4_No_longer_updatable: reasons.R4_No_longer_updatable || undefined, // TODO find out why r4 no hits
    //@ts-ignore
    R5_Tests: reasons.R5_Tests,
    //@ts-ignore
    R6_Errors: reasons.R6_Errors,
    //@ts-ignore
    R7_Quality_Requirement: reasons.R7_Quality_Requirement,
    //@ts-ignore
    R8_Unknown: reasons.R8_Unknown,
    percentages: {
      allReasons: getPercentage(allReasons.length, allReasons.length),
      R1_Superseded: getPercentage(
        //@ts-ignore
        reasons.R1_Superseded,
        allReasons.length,
      ),
      R2_Up_to_date: getPercentage(
        //@ts-ignore
        reasons.R2_Up_to_date,
        allReasons.length,
      ),
      R3_No_longer_a_dependency: getPercentage(
        //@ts-ignore
        reasons.R3_No_longer_a_dependency,
        allReasons.length,
      ),
      R4_No_longer_updatable: getPercentage(
        //@ts-ignore
        reasons.R4_No_longer_updatable || 0,
        allReasons.length,
      ),
      R5_Tests: getPercentage(
        //@ts-ignore
        reasons.R5_Tests,
        allReasons.length,
      ),
      R6_Errors: getPercentage(
        //@ts-ignore
        reasons.R6_Errors,
        allReasons.length,
      ),
      R7_Quality_Requirement: getPercentage(
        //@ts-ignore
        reasons.R7_Quality_Requirement,
        allReasons.length,
      ),
      R8_Unknown: getPercentage(
        //@ts-ignore
        reasons.R8_Unknown,
        allReasons.length,
      ),
    },
  };
}

export async function analyseRQ2(
  comments: TypeCombinedComments,
  props = propsExclude,
) {
  console.log('[analyseRQ2] props:', props.analyse);
  try {
    // ************* RQ2: What are the reasons for Dependabot security pull requests being not merged?
    // Analyse data from the 'comments' parameter.
    // 1) Identify reasons (for not merging the security PRs) from the comments.
    // 2) Categorize comments into 8 categories.
    // 3) log and classify each COMMENT (belonging to a non-merged PR), store the results in a new json file.
    // 4) the JSON file will be used to generate a spreadsheet, and should include attributes for:
    // Project name, PR number, Closure date, Reason for closure (based on categories mentioned above), and Additional notes or comments.

    console.log(
      `[${props.id}-${props.dataset}] Analysing NOT_MERGED comments dependabot security PRs...`,
    );
    console.log(
      `[${props.id}-${props.dataset}] Categorizing NOT_MERGED comments dependabot security PRs...`,
    );

    // Group comments by PR
    const commentsByPr = groupCommentsByPr(comments);

    await writeJsonFile(props, `RQ2-commentsByPr`, commentsByPr);

    const analysis: any[] = []; // Replace 'any' with your actual type

    for (const index in commentsByPr) {
      console.log('\n index:', index); // it's just an index...?
      const prComments = commentsByPr[index];

      const prCommentsKeys = Object.keys(prComments);
      console.log('prCommentsKeys:', prCommentsKeys);
      console.log('prComments keys length: ', prCommentsKeys.length);

      // get key at index
      const key = Object.keys(prComments)[0];
      console.log(
        //@ts-ignore
        `[${props.id}-${props.dataset}] prComments for PR key: ${key}`,
      );

      // get the value from prComments
      const prCommentsValues = Object.values(prComments);
      // console.log('prCommentsValues:', prCommentsValues);
      console.log('prCommentsValues length:', prCommentsValues.length);
      // console.log('prCommentsValues :', prCommentsValues);
      const prCommentsValuesPopped = prCommentsValues.pop();
      //console.log('prCommentsValuesPopped:', prCommentsValuesPopped);
      console.log(
        'prCommentsValuesPopped length:',
        prCommentsValuesPopped.length,
      );
      //await troubleshooting(props, prCommentsValuesPopped);

      if (prCommentsValuesPopped.length === 0) {
        console.error('No comments found for PR:', index);
        continue;
      }

      const reasonsForClosure = getReasonsForClosure(
        prCommentsValuesPopped,
        props,
      );

      analysis.push({
        cleanUrl: key, // Extract project name from PR URL
        index: index, // Extract PR number from PR URL
        closureDate: undefined, // TODO: Replace with actual closure date from DSPR data *************************************** update needed
        reasonsForClosure: reasonsForClosure, // .join(', '),
        additionalNotes: '', // TODO: Add any additional notes as needed
        additionalComments: '', // TODO: Add any additional comments as needed
        amountOfComments: prCommentsValuesPopped.length,
      });
    }

    // Write the analysis results to a new JSON file for further processing
    await writeJsonFile(props, `RQ2-analysis`, analysis); // TODO figure out why every item has "amountOfComments": 2,
    // write the results to a new JSON file
    const resultRQ2 = filterReasons(analysis, props);

    console.log('[analyseRQ2] resultRQ2: ', resultRQ2);
    const jsonWithNulls = JSON.parse(
      JSON.stringify(resultRQ2, (key, value) =>
        value === undefined ? null : value,
      ),
    );
    //const stringifiedJson = JSON.stringify(jsonWithNulls, null, 2);
    await writeJsonFile(props, 'RQ2-reasons-for-not-merging', [jsonWithNulls]);

    return analysis;
  } catch (error) {
    // (PRs that lack discussion or comment data entirely will be excluded)
    handleError(props, error, 'analyse-RQ2');
  }
}

//analyseRQ2().catch(console.error);
