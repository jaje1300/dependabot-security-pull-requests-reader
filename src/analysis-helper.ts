import { PullsType } from './octokit-service';
import { prStatus } from './transformation-helper';

export const filterByStatus = (dsprs: PullsType, status: TypeDsprStatus) => {
  return dsprs.filter((dspr) => prStatus(dspr) === status);
};

export const getPercentage = (part: number, total: number) => {
  return (part / total) * 100;
};
