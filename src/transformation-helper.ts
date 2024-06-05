export const cleanUrl = (dsprCommentsUrl: string) =>
  dsprCommentsUrl.replace('/comments', '');

export const singleLineItem = (body: string | null) =>
  body?.replace(/[\n>]/gm, ' ');

export const prStatus = (dspr: any) =>
  dspr.merged_at ? 'MERGED' : 'NOT_MERGED';

export const fileName = (repoFullName: string) =>
  repoFullName.replace(/\//g, '-').toLowerCase();
