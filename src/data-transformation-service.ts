import { readJsonComments, readJsonDataset } from './file-service';
import { transformJsonToCsv } from './json-csv-service';
import { handleError } from './log-service';
import { failSafe } from './index.helper';
import { propsExclude } from './index.props';

export async function transformData(props = propsExclude) {
  console.log('[transformData] props:', props);

  try {
    console.time('[transformData] Total process time');
    // read json files
    const jsonDataset = await readJsonDataset(props);
    const jsonComments = await readJsonComments(props);
    failSafe(
      props,
      jsonDataset,
      jsonComments.reviewComments,
      jsonComments.discussionComments,
    );

    // - comments - NOT_MERGED
    // preprocess the text data to remove noise and irrelevant information
    // (such as the presence of industry jargon, abbreviations, or project-specific terminolog)
    // for NLP analysis

    //convert to csv

    console.time('[transformData] Transforming JSON data to CSV');
    await transformJsonToCsv(
      props,
      jsonDataset,
      jsonComments.reviewComments,
      jsonComments.discussionComments,
    );
    console.timeEnd('[transformData] Transforming JSON data to CSV');

    console.timeEnd('[transformData] Total process time');
  } catch (error) {
    await handleError(props, error, 'transform-data');
  }

  console.log('\n');
}

//transformData().catch(console.error);
