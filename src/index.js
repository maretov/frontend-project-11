import './styles.scss';
import 'bootstrap';
import { object, string } from 'yup';
import { form, input, watchedState } from './view';

const schema = object({
  url: string().url(),
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const enteredUrl = input.value;

  if (watchedState.uploadedUrls.includes(enteredUrl)) {
    watchedState.state = 'exists';
    return;
  }

  schema
    .validate({ url: enteredUrl })
    .then((value) => {
      watchedState.uploadedUrls.push(value.url);
      watchedState.state = 'valid';
    })
    .catch(() => {
      watchedState.state = 'invalid';
    });
});
