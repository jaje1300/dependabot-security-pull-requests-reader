import { handleError } from './log-service';
import {
  generateCommentsCsv,
  generateCommentsByStatusCsv,
  generateInitialCsv,
  generateMetaCsv,
  generateRefinedCsv,
  writeCSVFiles,
  generateMetaByStatusCsv,
} from './json-csv-repository';

// Helper function to generate CSV data
const generateCsvData = async (
  props: TypeProps,
  csv: TypeCSV,
  jsonSecurityPulls: any[],
  jsonReviewComments: any[],
  jsonDiscussionComments: any[],
) => {
  if (props.dataset === 'Initial') {
    csv.initial = await generateInitialCsv(jsonSecurityPulls, props);
  }

  if (props.dataset === 'Refined') {
    csv.refined = await generateRefinedCsv(jsonSecurityPulls, props);
  }

  if (props.dataset === 'Meta') {
    csv.meta = await generateMetaCsv(jsonSecurityPulls, props);
  }

  if (props.dataset === 'Meta' && props.customDatasets) {
    csv.metaMerged = await generateMetaByStatusCsv(
      jsonSecurityPulls,
      props,
      'MERGED',
    );
  }

  if (props.comments.includeComments) {
    csv.metaNotMerged = await generateMetaByStatusCsv(
      jsonSecurityPulls,
      props,
      'NOT_MERGED',
    );
    csv.reviewCommentsNotMerged = await generateCommentsByStatusCsv(
      jsonReviewComments,
      props,
      'review',
      'NOT_MERGED',
    );
    csv.discussionCommentsNotMerged = await generateCommentsByStatusCsv(
      jsonDiscussionComments,
      props,
      'discussion',
      'NOT_MERGED',
    );
  }

  if (props.comments.includeComments && props.comments.customDatasets) {
    csv.reviewComments = await generateCommentsCsv(
      jsonReviewComments,
      props,
      'review',
    );
    csv.reviewCommentsMerged = await generateCommentsByStatusCsv(
      jsonReviewComments,
      props,
      'review',
      'MERGED',
    );
    csv.discussionComments = await generateCommentsCsv(
      jsonDiscussionComments,
      props,
      'discussion',
    );
    csv.discussionCommentsMerged = await generateCommentsByStatusCsv(
      jsonDiscussionComments,
      props,
      'discussion',
      'MERGED',
    );
  }

  return csv;
};

export async function transformJsonToCsv(
  props: TypeProps,
  jsonSecurityPulls: any[],
  jsonReviewComments: any[],
  jsonDiscussionComments: any[],
) {
  // convert json to csv
  // reduce data, divide into 3 focused datasets (initial, refined, meta)
  // for meta, also store comments
  // then we split meta - merged and not merged
  let csv = {
    initial: '',
    refined: '',
    meta: '',
    metaMerged: '',
    metaNotMerged: '',
    reviewComments: '',
    reviewCommentsMerged: '',
    reviewCommentsNotMerged: '',
    discussionComments: '',
    discussionCommentsMerged: '',
    discussionCommentsNotMerged: '',
  };
  try {
    csv = await generateCsvData(
      props,
      csv,
      jsonSecurityPulls,
      jsonReviewComments,
      jsonDiscussionComments,
    );
  } catch (error) {
    await handleError(props, error, 'generate-csv-data');
  }

  try {
    // write csv files
    await writeCSVFiles(props, csv);
  } catch (error) {
    await handleError(props, error, 'write-csv');
  }
}

//transformJsonToCsv().catch(console.error);
