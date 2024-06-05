import { writeToFolder } from './file-repository';

const logToFile = async (
  id: string,
  fileName: string,
  data: string,
  additionalFolder = '',
) => {
  let folderPath = `src/data/logs/${id}`;
  if (additionalFolder) {
    folderPath = `${folderPath}/${additionalFolder}`;
  }
  const filePath = `${folderPath}/${fileName}`;
  await writeToFolder(filePath, data, folderPath);
};

export const logLogs = async (
  props: TypeProps,
  logName: string,
  data: string,
  additionalFolder = '',
) => {
  await logToFile(props.id, `log-${logName}.md`, data, additionalFolder);
};

export const logStats = async (
  props: TypeProps,
  logName: string,
  data: string,
) => {
  await logToFile(props.id, `stats-${logName}.md`, data);
};

// Helper function to handle errors
export const handleError = async (
  props: TypeProps,
  error: any,
  errorType: string,
) => {
  console.error(`Error type [${errorType}]:`, error);
  const pathFolder = `src/data/logs/${props.id}`;
  const pathError = `src/data/logs/${props.id}/error-${errorType}.md`;
  await writeToFolder(pathError, JSON.stringify(error), pathFolder);
};
