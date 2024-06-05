import { json2csv } from 'json-2-csv';
import { cleanUrl, singleLineItem } from './transformation-helper';
import { writeToFolder } from './file-repository';
import { handleError, logLogs, logStats } from './log-service';
import {
  transformToComments,
  transformToMetaJsonSecurityPulls,
} from './json-csv-helper';

export async function generateInitialCsv(
  jsonSecurityPulls: any[],
  props: TypeProps,
): Promise<string> {
  // initial dataset (url, title, body)
  const initialJsonSecurityPulls = jsonSecurityPulls.map((dspr) => ({
    url: cleanUrl(dspr.comments_url),
    title: dspr.title,
    body: singleLineItem(dspr.body),
  }));
  const fieldsInitial = Object.keys(initialJsonSecurityPulls[0]);
  const logFieldsInitial = `[${props.id}-${props.dataset}] Fields to use: ${fieldsInitial} \n`;
  console.log(logFieldsInitial);
  await logLogs(props, 'initial-fields', logFieldsInitial);
  return json2csv(initialJsonSecurityPulls);
}

export async function generateRefinedCsv(
  jsonSecurityPulls: any[],
  props: TypeProps,
): Promise<string> {
  // refined dataset (repository_url_short, url, pull_request.url, title, body)
  try {
    const refinedJsonSecurityPulls = jsonSecurityPulls.map((dspr) => ({
      repository_url_short: dspr.repoFullName,
      url: cleanUrl(dspr.comments_url),
      pull_request_url: dspr.url,
      title: dspr.title,
      body: singleLineItem(dspr.body),
    }));
    const fieldsRefined = Object.keys(refinedJsonSecurityPulls[0]);
    const logFieldsRefined = `[${props.id}-${props.dataset}] Fields to use: ${fieldsRefined} \n`;
    console.log(logFieldsRefined);
    await logLogs(props, 'refined-fields', logFieldsRefined);
    return json2csv(refinedJsonSecurityPulls, {
      keys: [
        'repository_url_short',
        'url',
        { field: 'pull_request_url', title: 'pull_request.url' }, //dspr.pull_request.url,  // DOT IN KEY
        'title',
        'body',
      ],
    });
  } catch (error) {
    handleError(props, error, 'generate-refined-csv');
    return '';
  }
}

export async function generateMetaCsv(
  jsonSecurityPulls: any[],
  props: TypeProps,
): Promise<string> {
  // meta dataset (repository_url_short,url, comments_url, status, title, body, closed_by) after excluding open state PRs
  const metaJsonSecurityPulls =
    transformToMetaJsonSecurityPulls(jsonSecurityPulls);

  const logAmountMeta = `[${props.id}-${props.dataset}] Found: ${metaJsonSecurityPulls.length} CLOSED PRs \n`;
  console.log(logAmountMeta);
  await logStats(props, 'meta-closed', logAmountMeta);

  const fieldsMeta = Object.keys(metaJsonSecurityPulls[0]);
  const logFieldsMeta = `[${props.id}-${props.dataset}] Fields to use Meta: ${fieldsMeta} \n`;
  console.log(logFieldsMeta);
  await logLogs(props, 'meta-fields', logFieldsMeta);
  return json2csv(metaJsonSecurityPulls);
}

//go nuts with custom datasets

export async function generateMetaByStatusCsv(
  jsonSecurityPulls: any[],
  props: TypeProps,
  dsprStatus: TypeDsprStatus,
): Promise<string> {
  // meta dataset filter on PRs based on status
  const metaJsonSecurityPulls =
    transformToMetaJsonSecurityPulls(jsonSecurityPulls);
  const metaJsonSecurityPullsFiltered = metaJsonSecurityPulls.filter(
    (dspr) => dspr.status === dsprStatus,
  );
  const logAmountMeta = `[${props.id}-${props.dataset}] Found: ${metaJsonSecurityPullsFiltered.length} ${dsprStatus} PRs \n`;
  console.log(logAmountMeta);
  await logStats(props, `meta-${dsprStatus.toLowerCase()}`, logAmountMeta);

  const fieldsMeta = Object.keys(metaJsonSecurityPullsFiltered[0]);
  const logFieldsMeta = `[${props.id}-${
    props.dataset
  }] Fields to use Meta (${dsprStatus.toLowerCase()}): ${fieldsMeta} \n`;
  console.log(logFieldsMeta);
  await logLogs(
    props,
    `meta-${dsprStatus.toLowerCase()}-fields`,
    logFieldsMeta,
  );
  return json2csv(metaJsonSecurityPullsFiltered);
}

export async function generateCommentsCsv(
  comments: any[],
  props: TypeProps,
  commentType: TypeComments,
): Promise<string> {
  // comments after excluding open state PRs
  const commentsJson = transformToComments(comments, commentType);
  console.log(`${commentType} commentsJson: ${commentsJson.length}`);

  const fieldsComments = Object.keys(commentsJson[0]);
  const logFieldsComments = `[${props.id}-${props.dataset}] Fields to use (comments): ${fieldsComments} \n`;
  console.log(logFieldsComments);
  await logLogs(props, 'comments-fields', logFieldsComments);
  return json2csv(commentsJson);
}

export async function generateCommentsByStatusCsv(
  comments: any[],
  props: TypeProps,
  commentType: TypeComments,
  dsprStatus: TypeDsprStatus,
): Promise<string> {
  // comments after excluding open state PRs
  const commentsJson = transformToComments(comments, commentType);
  const commentsJsonFiltered = commentsJson.filter(
    (comment) => comment.dsprStatus === dsprStatus,
  );
  if (commentsJsonFiltered.length > 0) {
    const fieldsComments = Object.keys(commentsJsonFiltered[0]);
    const logFieldsComments = `[${props.id}-${
      props.dataset
    }] Fields to use comments (${dsprStatus.toLowerCase()}): ${fieldsComments} \n`;
    console.log(logFieldsComments);
    await logLogs(
      props,
      `comments-${dsprStatus.toLowerCase()}-fields`,
      logFieldsComments,
    );
  }
  console.log(
    `${commentType} commentsJsonFiltered: ${commentsJsonFiltered.length}`,
  );

  return json2csv(commentsJsonFiltered);
}

export async function writeCSVFiles(props: TypeProps, csv: TypeCSV) {
  const pathFolder = `src/data/dataset/${props.id}`;

  const pathData = `${pathFolder}/${props.dataset.toLowerCase()}.csv`;
  if (props.dataset === 'Initial') {
    await writeToFolder(pathData, csv.initial, pathFolder);
  }

  if (props.dataset === 'Refined') {
    await writeToFolder(pathData, csv.refined, pathFolder);
  }

  if (props.dataset === 'Meta') {
    await writeToFolder(pathData, csv.meta, pathFolder);
  }

  if (props.dataset === 'Meta' && props.customDatasets) {
    const pathDataMetaMerged = `${pathFolder}/meta-merged.csv`;
    await writeToFolder(pathDataMetaMerged, csv.metaMerged, pathFolder);
  }

  if (props.comments.includeComments) {
    const pathDataMetaNotMerged = `${pathFolder}/meta-not-merged.csv`;
    await writeToFolder(pathDataMetaNotMerged, csv.metaNotMerged, pathFolder);

    const pathReviewCommentsNotMerged = `${pathFolder}/review-comments-not-merged.csv`;
    await writeToFolder(
      pathReviewCommentsNotMerged,
      csv.reviewCommentsNotMerged,
      pathFolder,
    );
    const pathDiscussionCommentsNotMerged = `${pathFolder}/discussion-comments-not-merged.csv`;
    await writeToFolder(
      pathDiscussionCommentsNotMerged,
      csv.discussionCommentsNotMerged,
      pathFolder,
    );
  }

  if (props.comments.includeComments && props.comments.customDatasets) {
    const pathReviewComments = `${pathFolder}/review-comments.csv`;
    await writeToFolder(pathReviewComments, csv.reviewComments, pathFolder);

    const pathReviewCommentsMerged = `${pathFolder}/review-comments-merged.csv`;
    await writeToFolder(
      pathReviewCommentsMerged,
      csv.reviewCommentsMerged,
      pathFolder,
    );

    const pathDiscussionComments = `${pathFolder}/discussion-comments.csv`;
    await writeToFolder(
      pathDiscussionComments,
      csv.discussionComments,
      pathFolder,
    );

    const pathDiscussionCommentsMerged = `${pathFolder}/discussion-comments-merged.csv`;
    await writeToFolder(
      pathDiscussionCommentsMerged,
      csv.discussionCommentsMerged,
      pathFolder,
    );
  }
}

//transformJsonToCsv().catch(console.error);
