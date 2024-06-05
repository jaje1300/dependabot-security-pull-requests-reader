import { handleError } from './log-service';
import {
  readJsonComments,
  readJsonDataset,
  writeJsonFile,
} from './file-service';
import { Octokit, PullsType, RepoType, getMyOctokit } from './octokit-service';
import {
  getActiveRepositories,
  getCommentsForDSPRs,
  getDSPRs,
} from './index.repository';
import { propsInitial, propsRefine, propsExclude } from './index.props';
import { getDecisionTimes } from './analysis-RQ1';
import { filterRapidMerges } from './analysis-RQ3';
import { updatePulls } from './octo-pull-service';
import { RAPID_MERGE_TIME } from './constants';

export async function updateData(props = propsExclude) {
  const myOctokit = getMyOctokit();

  console.log('[updateData] props:', props);
  try {
    console.time('[updateData] Total process time');

    const dsprs: PullsType = await readJsonDataset(props);
    const timesMerged = await getDecisionTimes(dsprs, 'MERGED', props);
    const rq3 = filterRapidMerges(dsprs, timesMerged, props, RAPID_MERGE_TIME);

    console.time('Updating the RAPID PR data');
    const rapidDSPRs = await updatePulls(props, rq3.rapid, myOctokit);
    await writeJsonFile(props, 'updated-rapid-dsprs', rapidDSPRs);
    console.timeEnd('Updating the RAPID PR data');

    console.timeEnd('[updateData] Total process time');
    console.log('\n');
  } catch (error) {
    handleError(props, error, 'update-data');
  }
}

//updateData().catch(console.error);
