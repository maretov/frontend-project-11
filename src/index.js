import './styles.scss';
import 'bootstrap';
import { object, string } from 'yup';
import { form, input, watchedState } from './view';
import axios from 'axios';
import { parseRss } from './parser';

const schema = object({
  url: string().url(),
});

const addPostInPosts = (post, feedId) => {
  const postId = watchedState.postsCount;
  watchedState.postsCount += 1;
  const postUrl = post.querySelector('link').textContent;
  const postTitle = post.querySelector('title').textContent;
  const postDescription = post.querySelector('description').textContent;

  watchedState.posts.push({ feedId, postId, postUrl, postTitle, postDescription });
};

const updatePosts = () => {
  // console.log('WHATCHEDSTATE.POSTS: ', watchedState.posts);
  setTimeout(() => {
    watchedState.feeds.forEach((feed) => {
      const { feedId, feedUrl } = feed;
      axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${feedUrl}`)
        .then((response) => {
          const { contents } = response.data;
          const parsed = parseRss(contents, 'text/xml');
          const feed = parsed.querySelector('channel');
          const posts = feed.querySelectorAll('item');
          const filteredPosts = watchedState.posts.filter((post) => post.feedId === feedId);
          const startPosition = filteredPosts.length;
          // console.log(`startPosittion: ${startPosition}`);
          posts.forEach((post, index) => {
            console.log(`index: ${index}`);
            if (index >= startPosition) {
              addPostInPosts(post, feedId);
              console.log('POSTS UPDATED!');
            }
          });
        })
        .then(() => updatePosts())
        .catch((error) => {
          console.log('ERROR in setTimeout: ', error);
        });
    });
  }, 2000);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const feedUrl = input.value;

  const existedFeedUrls = watchedState.feeds.map(({ feedUrl }) => feedUrl);
  if (existedFeedUrls.includes(feedUrl)) {
    watchedState.state = 'exists';
    return;
  }

  schema
    .validate({ url: feedUrl })
    .then(({ url }) => {
      watchedState.state = 'uploading';
      return axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`);
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

      watchedState.feeds.push({ feedId, feedUrl, feedTitle, feedDescription });

      const posts = feed.querySelectorAll('item');
      posts.forEach((post) => {
        const postId = watchedState.postsCount;
        watchedState.postsCount += 1;
        const postUrl = post.querySelector('link').textContent;
        const postTitle = post.querySelector('title').textContent;
        const postDescription = post.querySelector('description').textContent;

        watchedState.posts.push({ feedId, postId, postUrl, postTitle, postDescription });
      });

      watchedState.state = 'uploaded';
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
          console.log('THIS IS UNKNOWN ERROR: ', error);
      }  
    });
});
