import { string } from 'yup';
import axios from 'axios';
import i18n from 'i18next';
import parseRss from './parser.js';
import resources from './locales/index.js';
import {
  form,
  input,
  startStateWatching,
  postsContainer,
} from './view.js';

const state = { // 6 possible states: uploaded, exists, invalidUrl, invalidRss, uploading, updated
  app: {
    state: 'uploaded',
    nextId: 0,
    feeds: [],
    posts: [],
  },
  ui: {
    modalId: null,
    posts: [],
  },
};

export default () => {
  let watchedState;

  const i18nInstance = i18n.createInstance();
  i18nInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => {
      watchedState = startStateWatching(state, i18nInstance);
    });

  const alloriginsUrl = 'https://allorigins.hexlet.app/get?disableCache=true';

  const createSchema = () => {
    const existedUrls = state.app.feeds.map(({ feedUrl }) => feedUrl);
    return string().url().notOneOf(existedUrls);
  };

  const addPostInPosts = (post, feedId) => {
    const postId = watchedState.app.nextId;
    watchedState.app.nextId += 1;
    const { postUrl, postTitle, postDescription } = post;

    watchedState.app.posts.push({
      feedId,
      postId,
      postUrl,
      postTitle,
      postDescription,
    });

    watchedState.ui.posts.push({
      postId,
      state: 'notViewed',
    });

    watchedState.app.state = 'uploading';
    watchedState.app.state = 'updated';
  };

  const getUrlFromResponse = (response) => {
    const { url } = response.config;
    const splittedUrl = url.split('url=');
    const encodedUrl = splittedUrl[1];
    return decodeURIComponent(encodedUrl);
  };

  const startUpdatingPosts = () => {
    setTimeout(() => {
      const promises = watchedState.app.feeds
        .map(({ feedUrl }) => axios.get(`${alloriginsUrl}&url=${encodeURIComponent(feedUrl)}`));

      Promise.all(promises)
        .then((responses) => {
          responses.forEach((response) => {
            const currentUrl = getUrlFromResponse(response);
            const feed = watchedState.app.feeds.find(({ feedUrl }) => feedUrl === currentUrl);
            const { feedId } = feed;

            const parsed = parseRss(response.data.contents, 'text/xml');
            const { posts } = parsed;

            const filteredPostsUrls = watchedState.app.posts
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
          console.log(`Updating error: ${error}`);
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
      return watchedState.ui.posts.find((post) => post.postId === id);
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
        watchedState.ui.modalId = Number(e.target.id);
        break;
      }
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredUrl = input.value;

    createSchema()
      .validate(enteredUrl)
      .then((url) => {
        watchedState.app.state = 'uploading';
        return axios.get(`${alloriginsUrl}&url=${encodeURIComponent(url)}`);
      })
      .then((response) => {
        const parsed = parseRss(response.data.contents, 'text/xml');
        if (parsed === 'parsererror') {
          watchedState.app.state = 'invalidRss';
          return;
        }

        const feedId = watchedState.app.nextId;
        watchedState.app.nextId += 1;
        const feedUrl = getUrlFromResponse(response);
        const { feedTitle, feedDescription } = parsed.feed;

        watchedState.app.feeds.push({
          feedId,
          feedUrl,
          feedTitle,
          feedDescription,
        });

        parsed.posts.forEach((post) => {
          const postId = watchedState.app.nextId;
          watchedState.app.nextId += 1;
          const { postUrl, postTitle, postDescription } = post;

          watchedState.app.posts.push({
            feedId,
            postId,
            postUrl,
            postTitle,
            postDescription,
          });

          watchedState.ui.posts.push({
            postId,
            state: 'notViewed',
          });
        });

        watchedState.app.state = 'uploaded';
      })
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          watchedState.app.state = 'networkError';
          return;
        }

        if (error.name === 'ValidationError') {
          switch (error.type) {
            case 'url':
              watchedState.app.state = 'invalidUrl';
              break;
            case 'notOneOf':
              watchedState.app.state = 'exists';
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
