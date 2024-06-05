const propsInitial: TypeProps = {
  id: '18',
  repos: {
    readFromCache: true,
    params: {
      q: 'language:javascript',
      //sort: 'updated',
      //order: 'desc',
      per_page: 100,
    },
    commits: {
      minimum: 1,
    },
  },
  pulls: {
    readFromCache: true,
    params: {
      state: 'all', // check all PRs, including not reviewed ones
      creator: 'app/dependabot', // Dependabot's username // note: is this really reliable?
      per_page: 100,
    },
  },
  dataset: 'Total',
  customDatasets: false,
  comments: {
    readFromCache: false,
    includeComments: false,
    customDatasets: false,
  },
  analyse: {
    readFromCache: true,
  },
  testRun: false,
};

const propsRefine: TypeProps = {
  id: '19',
  repos: {
    readFromCache: true,
    params: {
      q: 'language:javascript stars:>=500 fork:false',
      sort: 'stars',
      order: 'desc',
      per_page: 100,
    },
    commits: {
      minimum: 20,
    },
  },
  pulls: {
    readFromCache: false,
    params: {
      state: 'all',
      creator: 'app/dependabot',
      per_page: 100,
    },
  },
  dataset: 'Refined',
  customDatasets: false,
  comments: {
    readFromCache: false,
    includeComments: false,
    customDatasets: false,
  },
  analyse: {
    readFromCache: true,
  },
  testRun: false,
};

const propsExclude: TypeProps = {
  id: 'post-april-2021-v3',
  repos: {
    readFromCache: true,
    params: {
      q: 'language:javascript stars:>=500 fork:false created:>2021-04-01',
      sort: 'stars',
      order: 'desc',
      per_page: 100, // can we add time range, and paginate through all? doesn't seem like search.repos supports time range
    },
    commits: {
      minimum: 20,
    },
  },
  pulls: {
    readFromCache: true,
    params: {
      state: 'closed', // excluding all PR with open state (closed refers to decisions, may be both MERGED and NOT_MERGED)
      creator: 'app/dependabot',
      per_page: 100,
    },
  },
  dataset: 'Meta',
  customDatasets: false,
  comments: {
    readFromCache: true,
    includeComments: true,
    customDatasets: false,
  },
  analyse: {
    readFromCache: true,
  },
  testRun: false,
};

export { propsInitial, propsRefine, propsExclude };
