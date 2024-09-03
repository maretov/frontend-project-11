import { object, string } from 'yup';
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
  const schema = object({
    url: string().url(),
  });

  postsContainer.addEventListener('click', (e) => {
    const getViewedPost = (button) => {
      const id = Number(button.id);
      return watchedUiState.posts.find((post) => post.postId === id);
    };

    switch (e.target.tagName) {
      case 'A': {
        const button = e.target.nextSibling;
        getViewedPost(button).state = 'viewed';
        break;
      }
      case 'BUTTON':
        getViewedPost(e.target).state = 'viewed';
        watchedUiState.modalId = Number(e.target.id);
        break;
      default:
        break;
    }
  });

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

  const startUpdatingPosts = () => {
    setTimeout(() => {
      watchedState.feeds.forEach((feed) => {
        const { feedId, feedUrl } = feed;

        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feedUrl)}`)
          .then((response) => {
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
          })
          .then(() => startUpdatingPosts())
          .catch((error) => {
            console.log(`Error: ${error}`);
          });
      });
    }, 5000);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredUrl = input.value;

    const existedFeedUrls = watchedState.feeds.map(({ feedUrl }) => feedUrl);
    if (existedFeedUrls.includes(enteredUrl)) {
      watchedState.state = 'exists';
      return;
    }

    schema
      .validate({ url: enteredUrl })
      .then(({ url }) => {
        watchedState.state = 'uploading';
        return axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`);
      })
      .then((response) => {
        const { contents } = response.data;
        const { url } = response.config;
        const splittedUrl = url.split('url=');
        const encodedUrl = splittedUrl[1];
        const decodedUrl = decodeURIComponent(encodedUrl);

        const parsed = parseRss(contents, 'text/xml');
        if (parsed === 'parsererror') {
          watchedState.state = 'invalidRss';
          return;
        }

        const feedId = watchedState.feedsCount;
        watchedState.feedsCount += 1;
        const feedUrl = decodedUrl;
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
      .then(() => {
        startUpdatingPosts();
      })
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          watchedState.state = 'networkError';
        } else if (error.name === 'ValidationError') {
          watchedState.state = 'invalidUrl';
        } else {
          throw new Error(`Unknown error: ${error}`);
        }
      });
  });
};
