import { string } from 'yup';
import axios from 'axios';
import parseRss from './parser.js';
import {
  form,
  input,
  watchedState,
  watchedUiState,
  postsContainer,
} from './view.js';

export default () => {
  const createSchema = (urls) => string().url().notOneOf(urls);

  const alloriginsUrl = 'https://allorigins.hexlet.app/get?disableCache=true';

  const addPostInPosts = (post, feedId) => {
    const postId = watchedState.postsCount;
    watchedState.postsCount += 1;
    const { postUrl, postTitle, postDescription } = post;

    watchedState.posts.push({
      feedId,
      postId,
      postUrl,
      postTitle,
      postDescription,
    });

    watchedUiState.posts.push({
      postId,
      state: 'notViewed',
    });

    watchedState.state = 'uploading';
    watchedState.state = 'uploaded';
  };

  const getUrlFromResponse = (response) => {
    const { url } = response.config;
    const splittedUrl = url.split('url=');
    const encodedUrl = splittedUrl[1];
    return decodeURIComponent(encodedUrl);
  };

  const startUpdatingPosts = () => {
    setTimeout(() => {
      const promises = watchedState.feeds
        .map(({ feedUrl }) => axios.get(`${alloriginsUrl}&url=${encodeURIComponent(feedUrl)}`));

      Promise.all(promises)
        .then((responses) => {
          responses.forEach((response) => {
            const currentUrl = getUrlFromResponse(response);
            const feed = watchedState.feeds.find(({ feedUrl }) => feedUrl === currentUrl);
            const { feedId } = feed;

            const { contents } = response.data;
            const parsed = parseRss(contents, 'text/xml');
            const { posts } = parsed;

            const filteredPostsUrls = watchedState.posts
              .filter((post) => post.feedId === feedId)
              .map((post) => post.postUrl);

            posts.forEach((post) => {
              const { postUrl } = post;
              if (!filteredPostsUrls.includes(postUrl)) {
                addPostInPosts(post, feedId);
              }
            });
          });
        })
        .catch((error) => {
          console.log(`Updating erroR: ${error}`);
        })
        .finally(() => {
          startUpdatingPosts();
        });
    }, 5000);
  };

  startUpdatingPosts();

  postsContainer.addEventListener('click', (e) => {
    const getViewedPost = (button) => {
      const id = Number(button.id);
      return watchedUiState.posts.find((post) => post.postId === id);
    };

    switch (e.target.tagName) {
      case 'A': {
        const button = e.target.nextSibling;
        const viewedPost = getViewedPost(button);
        viewedPost.state = 'viewed';
        break;
      }
      case 'BUTTON': {
        const viewedPost = getViewedPost(e.target);
        viewedPost.state = 'viewed';
        watchedUiState.modalId = Number(e.target.id);
        break;
      }
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredUrl = input.value;

    createSchema(watchedState.existedFeedUrls)
      .validate(enteredUrl)
      .then((url) => {
        watchedState.state = 'uploading';
        return axios.get(`${alloriginsUrl}&url=${encodeURIComponent(url)}`);
      })
      .then((response) => {
        const { contents } = response.data;
        const url = getUrlFromResponse(response);

        const parsed = parseRss(contents, 'text/xml');
        if (parsed === 'parsererror') {
          watchedState.state = 'invalidRss';
          return;
        }

        watchedState.existedFeedUrls.push(url);

        const feedId = watchedState.feedsCount;
        watchedState.feedsCount += 1;
        const feedUrl = url;
        const { feedTitle, feedDescription } = parsed.feed;

        watchedState.feeds.push({
          feedId,
          feedUrl,
          feedTitle,
          feedDescription,
        });

        parsed.posts.forEach((post) => {
          const postId = watchedState.postsCount;
          watchedState.postsCount += 1;
          const { postUrl, postTitle, postDescription } = post;

          watchedState.posts.push({
            feedId,
            postId,
            postUrl,
            postTitle,
            postDescription,
          });

          watchedUiState.posts.push({
            postId,
            state: 'notViewed',
          });
        });

        watchedState.state = 'uploaded';
      })
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          watchedState.state = 'networkError';
          return;
        }

        if (error.name === 'ValidationError') {
          switch (error.type) {
            case 'url':
              watchedState.state = 'invalidUrl';
              break;
            case 'notOneOf':
              watchedState.state = 'exists';
              break;
            default:
              throw new Error(`Unknown error.type: ${error.type}`);
          }
          return;
        }

        throw new Error(`Unknown error: ${error}`);
      });
  });
};
