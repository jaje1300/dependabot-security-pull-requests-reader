type TypeR3Rapid = {
  dsprNumber: number;
  repoFullName: string;
  title: string;
  changedLines: number;
  percAccepted: number;
  autoMerge: boolean;
  mergeTime: number;
  patchLevel?: string;
  mergedAt?: string;
  createdAt?: string;
}[];
type TypeDecisionTimes = {
  dsprNumber: number;
  timeDifference: number;
  status: TypeDsprStatus;
  repoFullName: string;
}[];
type TypeComments = 'review' | 'discussion';
type TypeDsprStatus = 'MERGED' | 'NOT_MERGED';
type TypeCSV = {
  initial: string;
  refined: string;
  meta: string;
  metaMerged: string;
  metaNotMerged: string;
  reviewComments: string;
  reviewCommentsMerged: string;
  reviewCommentsNotMerged: string;
  discussionComments: string;
  discussionCommentsMerged: string;
  discussionCommentsNotMerged: string;
};
type TypeProps = {
  id: string;
  repos: {
    readFromCache: boolean;
    params: {
      q: string;
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated' | undefined;
      order?: 'desc' | 'asc' | undefined;
      per_page: number;
    };
    commits: {
      minimum: number;
    };
  };
  pulls: {
    readFromCache: boolean;
    params: {
      state: 'all' | 'closed' | 'open' | undefined;
      creator: string;
      per_page: number;
    };
  };
  dataset: string;
  customDatasets: boolean;
  comments: {
    readFromCache: boolean;
    includeComments: boolean;
    customDatasets: boolean;
  };
  analyse: {
    readFromCache: boolean;
  };
  testRun: boolean;
};
type LogValues = {
  countSecurityPrs: number;
  logTotal: string;
  logStats: string;
  logFoundSecurityPRsRepos: string;
};
type Repo = {
  id?: number;
  node_id?: string;
  name?: string;
  full_name: any;
  owner?: {
    name?: string | null | undefined;
    email?: string | null | undefined;
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string | null;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    starred_at?: string | undefined;
  } | null;
  private?: boolean;
  html_url?: string;
  description?: string | null;
  fork?: boolean;
  url?: string;
  created_at?: string;
  updated_at?: string;
  pushed_at?: string;
  homepage?: string | null;
  size?: number;
  stargazers_count?: number;
  watchers_count?: number;
  language?: string | null;
  forks_count?: number;
  open_issues_count?: number;
  master_branch?: string | undefined;
  default_branch?: string;
  score?: number;
  forks_url?: string;
  keys_url?: string;
  collaborators_url?: string;
  teams_url?: string;
  hooks_url?: string;
  issue_events_url?: string;
  events_url?: string;
  assignees_url?: string;
  branches_url?: string;
  tags_url?: string;
  blobs_url?: string;
  git_tags_url?: string;
  git_refs_url?: string;
  trees_url?: string;
  statuses_url?: string;
  languages_url?: string;
  stargazers_url?: string;
  contributors_url?: string;
  subscribers_url?: string;
  subscription_url?: string;
  commits_url?: string;
  git_commits_url?: string;
  comments_url?: string;
  issue_comment_url?: string;
  contents_url?: string;
  compare_url?: string;
  merges_url?: string;
  archive_url?: string;
  downloads_url?: string;
  issues_url?: string;
  pulls_url?: string;
  milestones_url?: string;
  notifications_url?: string;
  labels_url?: string;
  releases_url?: string;
  deployments_url?: string;
  git_url?: string;
  ssh_url?: string;
  clone_url?: string;
  svn_url?: string;
  forks?: number;
  open_issues?: number;
  watchers?: number;
  topics?: string[] | undefined;
  mirror_url?: string | null;
  has_issues?: boolean;
  has_projects?: boolean;
  has_pages?: boolean;
  has_wiki?: boolean;
  has_downloads?: boolean;
  has_discussions?: boolean | undefined;
  archived?: boolean;
  disabled?: boolean;
  visibility?: string | undefined;
  license?: {
    key: string;
    name: string;
    url:
      | string // TO-DO: Paginate
      | null;
    spdx_id: string | null;
    node_id: string;
    html_url?: string | undefined;
  } | null;
  permissions?:
    | {
        admin: boolean;
        maintain?: boolean | undefined;
        push: boolean;
        triage?: boolean | undefined;
        pull: boolean;
      }
    | undefined;
  text_matches?:
    | {
        object_url?: string | undefined;
        object_type?:
          | string
          //diff with initial/total? try to dump it into the raw dataset? use ID to compare?
          // Get most starred, non-forked JavaScript repositories (up to 100)
          | null //diff with initial/total? try to dump it into the raw dataset? use ID to compare?
          // Get most starred, non-forked JavaScript repositories (up to 100)
          | undefined;
        property?: string | undefined;
        fragment?: string | undefined;
        matches?: // Get most starred, non-forked JavaScript repositories (up to 100)

        | { text?: string | undefined; indices?: number[] | undefined }[]
          | undefined;
      }[]
    | undefined;
  temp_clone_token?: string | undefined;
  allow_merge_commit?: boolean | undefined;
  allow_squash_merge?: boolean | undefined;
  allow_rebase_merge?: boolean | undefined;
  allow_auto_merge?: boolean | undefined;
  delete_branch_on_merge?: boolean | undefined;
  allow_forking?: boolean | undefined;
  is_template?: boolean | undefined;
  web_commit_signoff_required?: boolean | undefined;
};
