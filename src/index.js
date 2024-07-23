import './styles.scss';
import 'bootstrap';
import { object, string } from 'yup';
import { form, input, watchedState } from './view';
import axios from 'axios';
import { parseRss } from './parser';

const schema = object({
  url: string().url(),
});

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

      watchedState.feeds.push({ id: feedId, feedUrl, feedTitle, feedDescription });

      const posts = feed.querySelectorAll('item');
      posts.forEach((post) => {
        const postId = watchedState.postsCount;
        watchedState.postsCount += 1;
        const postUrl = post.querySelector('link').textContent;
        const postTitle = post.querySelector('title').textContent;
        const postDescription = post.querySelector('description').textContent;

        watchedState.posts.push({ feedId, id: postId, postUrl, postTitle, postDescription });
      });

      watchedState.state = 'uploaded';
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
