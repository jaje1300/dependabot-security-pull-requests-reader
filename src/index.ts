import { propsInitial, propsRefine, propsExclude } from './index.props';
import { collectData } from './data-collection-service';
import { transformData } from './data-transformation-service';
import { analyseData } from './data-analysis-service';

async function main() {
  console.time('Total process time');

  //const props = propsInitial;
  //const props = propsRefine;
  const props = propsExclude;

  //Collect data
  console.time('Collecting data');
  await collectData(props);
  console.timeEnd('Collecting data');

  //Analyse RQ1: How often and how fast are Dependabot security pull requests merged?
  //Analyse RQ2: What are the reasons for Dependabot security pull requests being not merged? (categorise comments, AI?)
  //Analyse RQ3: What factors are associated with rapid merge times? (collect factors, AI?)
  console.time('Analysing JSON data');
  await analyseData(props);
  console.timeEnd('Analysing JSON data');

  //Transform data
  console.time('Transforming data');
  await transformData(props);
  console.timeEnd('Transforming data');

  //AI analysis of comments, factors?
  // console.time('Analysing CSV data');
  // await analyseData(props);
  // console.timeEnd('Analysing CSV data');

  console.timeEnd('Total process time');

  console.log('\n');
}

main().catch(console.error);
