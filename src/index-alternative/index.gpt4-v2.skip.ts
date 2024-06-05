//chat gpt (4) version 2
// This script will search for JavaScript repositories with vulnerability alerts and then filter out the pull requests authored by Dependabot that patch a security-related dependency vulnerability. The script will log the repository name and the URLs of the matching pull requests in the console.

// Please note that the GitHub API has rate limits, so you might need to adjust the search query or paginate the results to avoid reaching the limit. You can learn more about the rate limits here: https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting

import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

const TOKEN = 'YOUR_PERSONAL_ACCESS_TOKEN';
const octokit = new Octokit({ auth: TOKEN });

// Function to search for JavaScript repositories with vulnerability alerts
async function searchJavaScriptReposWithVulnerabilities() {
  const query = 'language:javascript sort:updated-desc';
  const searchResults = await octokit.search.repos({ q: query, per_page: 100 });

  const vulnerableRepos = [];

  for (const repo of searchResults.data.items) {
    const alertsUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/vulnerability-alerts`;
    const response = await fetch(alertsUrl, {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github.vixen-preview+json',
      },
    });

    if (response.status === 200) {
      vulnerableRepos.push(repo);
    }
  }

  return vulnerableRepos;
}

// Function to get Dependabot pull requests for a given repository
async function getDependabotPullRequests(repo) {
  const prs = await octokit.pulls.list({
    owner: repo.owner.login,
    repo: repo.name,
    state: 'all',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
  });

  return prs.data.filter(
    (pr) =>
      pr.user.login === 'dependabot[bot]' &&
      pr.title.toLowerCase().includes('bump') &&
      pr.title.toLowerCase().includes('security'),
  );
}

async function main() {
  const vulnerableRepos = await searchJavaScriptReposWithVulnerabilities();

  for (const repo of vulnerableRepos) {
    const dependabotPRs = await getDependabotPullRequests(repo);
    console.log(`Repository: ${repo.full_name}`);
    console.log(
      `Dependabot PRs: ${dependabotPRs.map((pr) => pr.html_url).join('\n')}`,
    );
    console.log('--------------------------------------');
  }
}

main().catch(console.error);
