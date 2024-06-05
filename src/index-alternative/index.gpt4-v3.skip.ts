// chat gpt (4) version 3

// The GitHub API doesn't directly provide a way to filter pull requests by the author's username (Dependabot in this case) or by the nature of the changes (patching a “security related dependency vulnerability”). However, you can fetch pull requests from GitHub and then manually filter the results.

// In the case of security patches, you'll have to infer from the PR's title or description. As of my knowledge cutoff in September 2021, Dependabot makes PRs with a consistent naming pattern such as "Bump [dependency] from [version] to [version]" and usually includes a note about a security vulnerability in the description, which you can look for.

import { Octokit } from '@octokit/rest';
import { paginateRest } from '@octokit/plugin-paginate-rest';

const MyOctokit = Octokit.plugin(paginateRest);
const octokit = new MyOctokit({
  auth: 'your github token', // replace with your GitHub token
});

const isSecurityRelated = (pr: any): boolean => {
  const regex = /Bump .+ from .+ to .+ due to a vulnerability/g;
  return regex.test(pr.title);
};

async function fetchAndFilterPRs() {
  // Fetch all open pull requests
  const pullRequests = await octokit.paginate(
    octokit.search.issuesAndPullRequests,
    {
      q: 'is:pr is:open language:JavaScript', // adjust this query as needed
    },
  );

  // Filter the pull requests by author and title
  const dependabotSecurityPRs = pullRequests.filter(
    (pr) => pr.user.login === 'dependabot[bot]' && isSecurityRelated(pr),
  );

  return dependabotSecurityPRs;
}

fetchAndFilterPRs()
  .then((prs) => {
    console.log(prs); // do something with the filtered pull requests
  })
  .catch((e) => {
    console.error(e); // handle any errors
  });
