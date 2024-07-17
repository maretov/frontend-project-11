import './styles.scss';
import 'bootstrap';
import { object, string } from 'yup';
import { form, input, watchedState } from './view';

const schema = object({
  url: string().url(),
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const feed = input.value;

  if (watchedState.feeds.includes(feed)) {
    watchedState.state = 'exists';
    return;
  }

  schema
    .validate({ url: feed })
    .then((value) => {
      watchedState.feeds.push(value.url);
      watchedState.state = 'uploaded';
    })
    .catch(() => {
      watchedState.state = 'invalid';
    });
});
