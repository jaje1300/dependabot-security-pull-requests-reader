import {
  readJsonFileComments,
  readJsonFileDataset,
  writeToFolder,
} from './file-repository';

export async function writeJsonFile(
  props: TypeProps,
  fileName: string,
  json: any[],
) {
  if (json.length === 0) {
    console.error(
      `Empty data to write to JSON file... dataset: ${props.dataset}`,
    );
    json = [];
  }
  //count keys with undefined values
  const undefinedValues = json.reduce((acc, item) => {
    const keys = Object.keys(item);
    const undefinedKeys = keys.filter(
      (key) => item[key] === undefined || item[key] === null,
    );
    return acc + undefinedKeys.length;
  }, 0);
  console.log('Undefined values in JSON data:', undefinedValues);
  const pathFolder = `src/data/dataset/${props.id}`;
  const stringifiedJson = JSON.stringify(json, null, 2);
  const pathJson = `${pathFolder}/${fileName}.json`;
  await writeToFolder(pathJson, stringifiedJson, pathFolder);
}

export async function readJsonDataset(props: TypeProps) {
  const jsonDatasetFromFile = await readJsonFileDataset(props);

  try {
    const jsonDataset: any[] = JSON.parse(jsonDatasetFromFile);
    const fieldsDataset = Object.keys(jsonDataset[0]);
    console.log('Dataset, fields ', fieldsDataset);

    return jsonDataset;
  } catch (error) {
    console.error('Error parsing JSON dataset:', error);
    throw error;
  }
}

export async function readJsonComments(props: TypeProps) {
  const { reviewComments, discussionComments } = await readJsonFileComments(
    props,
  );

  try {
    let jsonReviewComments: any[] = JSON.parse(reviewComments);
    let jsonDiscussionComments: any[] = JSON.parse(discussionComments);

    if (props.comments.includeComments) {
      if (jsonReviewComments.length > 0) {
        const fieldsReviewComments = Object.keys(jsonReviewComments[0]);
        console.log(
          'Review Comments read from file, fields ',
          fieldsReviewComments,
        );
      }
      if (props.comments.includeComments) {
        const fieldsDiscussionComments = Object.keys(jsonDiscussionComments[0]);
        console.log(
          'Discussion Comments read from file, fields ',
          fieldsDiscussionComments,
        );
      }
    } else {
      jsonReviewComments = ['include review comments false'];
      jsonDiscussionComments = ['include discussion comments false'];
    }

    return {
      reviewComments: jsonReviewComments,
      discussionComments: jsonDiscussionComments,
    };
  } catch (error) {
    console.error('Error parsing JSON comments:', error);
    throw error;
  }
}
