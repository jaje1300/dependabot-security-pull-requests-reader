import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
export { Octokit } from '@octokit/rest';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
const typeOctokit = new Octokit();

export type RepoType = GetResponseDataTypeFromEndpointMethod<
  typeof typeOctokit.search.repos
>['items'];
export type PullsType = GetResponseDataTypeFromEndpointMethod<
  typeof typeOctokit.pulls.list
>;
export type ReviewCommentsType = GetResponseDataTypeFromEndpointMethod<
  typeof typeOctokit.pulls.listReviewComments
>;
export type DiscussionCommentsType = GetResponseDataTypeFromEndpointMethod<
  typeof typeOctokit.issues.listComments
>;

const getMyOctokit = () => {
  const result = dotenv.config();
  if (result.error) {
    throw result.error;
  }
  console.log('Environment variables:', result.parsed);
  const token = result.parsed?.TOKEN;
  const myOctokit = createMyOctokit(token);
  return myOctokit;
};
export { getMyOctokit };

function createMyOctokit(token: string | undefined): Octokit {
  if (!token) {
    throw new Error('No token provided');
  }

  const myOctokit = new Octokit({
    auth: token,
    throttle: {
      onRateLimit: (retryAfter: number, options: any) => {
        // REACTIVE, after hitting rate limit
        myOctokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`,
        );
        // Retry twice after hitting a rate limit error, then give up
        if (options.request.retryCount <= 2) {
          console.log(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (
        retryAfter: number,
        options: any,
        myOctokit: Octokit,
      ) => {
        myOctokit.log.warn(
          `Secondary quota detected for request ${options.method} ${options.url}`,
        );
        // Retry twice after hitting a secondary rate limit error, then give up
        if (options.request.retryCount <= 2) {
          console.log(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onAbuseLimit: (retryAfter: number, options: any) => {
        myOctokit.log.warn(
          `Abuse detected for request ${options.method} ${options.url}`,
        );
        // Retry twice after hitting abuse rate limit error, then give up
        if (options.request.retryCount <= 2) {
          console.log(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
    },
    retry: {
      //doNotRetry: ['429'],
    },
  });

  return myOctokit;
}

export const handleRateLimit = async (octokit: Octokit) => {
  // PROACTIVE, before hitting rate limit
  const rateLimitStatus = await octokit.rateLimit.get();
  const remaining = rateLimitStatus.data.resources.core.remaining;
  const resetTime = new Date(rateLimitStatus.data.resources.core.reset * 1000);

  if (remaining === 0) {
    const currentTime = new Date();
    const timeToWait = resetTime.getTime() - currentTime.getTime();

    console.log(
      `Rate limit exceeded at ${currentTime}. Waiting until ${resetTime} to continue.`,
    );
    await new Promise((resolve) => setTimeout(resolve, timeToWait));
  }
};
