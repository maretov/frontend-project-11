import './styles.scss';
import 'bootstrap';
import { object, string } from 'yup';
import axios from 'axios';
import parseRss from './parser';
import {
  form,
  input,
  watchedState,
  watchedUiState,
  postsContainer,
} from './view';

const schema = object({
  url: string().url(),
});

const addListenersForButtons = () => {
  const buttons = postsContainer.querySelectorAll('button');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = Number(button.id);
      watchedUiState.modalId = id;
      const viewedPost = watchedUiState.posts.find((post) => post.postId === id);
      viewedPost.state = 'viewed';
    });
  });
};

const addPostInPosts = (post, feedId) => {
  const postId = watchedState.postsCount;
  watchedState.postsCount += 1;
  const postUrl = post.querySelector('link').textContent;
  const postTitle = post.querySelector('title').textContent;
  const postDescription = post.querySelector('description').textContent;

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

  addListenersForButtons();
};

const updatePosts = () => {
  setTimeout(() => {
    watchedState.feeds.forEach((feed) => {
      const { feedId, feedUrl } = feed;

      axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feedUrl)}`)
        .then((response) => {
          const { contents } = response.data;
          const parsed = parseRss(contents, 'text/xml');
          const newFeed = parsed.querySelector('channel');
          const posts = newFeed.querySelectorAll('item');

          const filteredPostsUrls = watchedState.posts
            .filter((post) => post.feedId === feedId)
            .map((post) => post.postUrl);

          posts.forEach((post) => {
            const postUrl = post.querySelector('link').textContent;
            if (!filteredPostsUrls.includes(postUrl)) {
              addPostInPosts(post, feedId);
            }
          });
        })
        .then(() => updatePosts())
        .catch((error) => {
          console.log(`Error: ${error}`);
          // alert(`Error: ${error.message}`);
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
      const { contents, status } = response.data;

      // checking rss for validity
      const format = contents.slice(0, 5);
      if (format !== '<?xml') {
        watchedState.state = 'invalidRss';
        return;
      }

      const parsed = parseRss(contents, 'text/xml');
      const feed = parsed.querySelector('channel');

      const feedId = watchedState.feedsCount;
      watchedState.feedsCount += 1;
      const feedUrl = status.url;
      const feedTitle = feed.querySelector('title').textContent;
      const feedDescription = feed.querySelector('description').textContent;

      watchedState.feeds.push({
        feedId,
        feedUrl,
        feedTitle,
        feedDescription,
      });

      const posts = feed.querySelectorAll('item');
      posts.forEach((post) => {
        const postId = watchedState.postsCount;
        watchedState.postsCount += 1;
        const postUrl = post.querySelector('link').textContent;
        const postTitle = post.querySelector('title').textContent;
        const postDescription = post.querySelector('description').textContent;

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

      addListenersForButtons();
    })
    .then(() => {
      updatePosts();
    })
    .catch((error) => {
      switch (error.name) {
        case 'ValidationError':
          console.log('THIS IS VALIDATION ERROR!!!');
          watchedState.state = 'invalidUrl';
          break;
        default:
          console.log(`Error: ${error}`);
      }
    });
});
