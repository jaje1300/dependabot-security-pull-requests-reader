import * as fs from 'fs/promises';

export const writeToFolder = async (
  filePath: string,
  data: string,
  folderPath: string,
) => {
  await createFolder(folderPath);
  await writeFile(filePath, data);
};

const createFolder = async (folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (error) {
    console.error('Error creating folder:', error);
  }
};
const writeFile = async (filePath: string, data: string) => {
  try {
    await fs.writeFile(filePath, data, 'utf8');
    console.log(`Data written to ${filePath}`);
  } catch (err) {
    console.error('Error writing to file:', err);
  }
};

export async function readJsonFile(props: TypeProps, fileName: string) {
  // Read JSON from file
  const pathFolder = `src/data/dataset/${props.id}`;
  let data: any[];

  const pathData = `${pathFolder}/${fileName}.json`;
  try {
    const res = await fs.readFile(pathData, 'utf8');
    data = JSON.parse(res);
    console.log(`Data read from file ${pathData}`);
  } catch (error) {
    console.error(`Error reading file from disk: ${error}`);
    throw error;
  }
  return data;
}

export async function readJsonFileDataset(props: TypeProps) {
  const pathFolder = `src/data/dataset/${props.id}`;
  let dataset = JSON.stringify([]);
  try {
    const pathData = `${pathFolder}/${props.dataset.toLowerCase()}.json`;
    dataset = await fs.readFile(pathData, 'utf8');
    console.log(`Data read from file ${pathData}`);
  } catch (err) {
    console.error(`Error reading file from disk: ${err}`);
    throw err;
  }
  return dataset;
}

export async function readJsonFileComments(props: TypeProps) {
  const pathFolder = `src/data/dataset/${props.id}`;
  let reviewComments = JSON.stringify([]);
  let discussionComments = JSON.stringify([]);
  try {
    if (props.comments.includeComments) {
      const pathReviewComments = `${pathFolder}/review-comments.json`;
      reviewComments = await fs.readFile(pathReviewComments, 'utf8');
      const pathDiscussionComments = `${pathFolder}/discussion-comments.json`;
      discussionComments = await fs.readFile(pathDiscussionComments, 'utf8');
    }
  } catch (err) {
    console.error(`Error reading file from disk: ${err}`);
    throw err;
  }

  return {
    reviewComments: reviewComments,
    discussionComments: discussionComments,
  };
}
