import {
  readJsonComments,
  readJsonDataset,
  writeJsonFile,
} from './file-service';
import { handleError } from './log-service';
import { PullsType } from './octokit-service';

import { propsInitial, propsRefine, propsExclude } from './index.props';
import { analyseRQ1 } from './analysis-RQ1';
import { analyseRQ3 } from './analysis-RQ3';
import { analyseRQ2 } from './analysis-RQ2';

export async function analyseData(props = propsExclude) {
  console.log('[analyseData] props:', props);
  try {
    console.time('[analyseData] Total process time');

    console.time('Reading the active repos');
    const dsprs: PullsType = await readJsonDataset(props);
    console.timeEnd('Reading the active repos');

    console.time('Analysing RQ 1');
    const resultRQ1 = await analyseRQ1(dsprs, props);
    console.timeEnd('Analysing RQ 1');

    console.time('Analysing RQ 2');
    const comments = await readJsonComments(props);
    const resultRQ2 = await analyseRQ2(comments, props);
    console.timeEnd('Analysing RQ 2');

    console.time('Analysing RQ 3');
    const resultRQ3 = await analyseRQ3(dsprs, props);
    console.timeEnd('Analysing RQ 3');

    console.timeEnd('[analyseData] Total process time');

    console.log('\n');
  } catch (error) {
    handleError(props, error, 'analyse-data');
  }
}

//analyseData().catch(console.error);
