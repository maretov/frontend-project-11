import onChange from 'on-change';
import i18n from 'i18next';
import resources from './locales/index.js';

const form = document.querySelector('form');
const input = form.querySelector('input');
const feedback = document.querySelector('.feedback');

const appState = { // 4 states: uploaded, exists, invalid, uploading
  feeds: [],
  state: 'uploaded',
};

const i18nInstance = i18n.createInstance();
i18nInstance.init({
  lng: 'ru',
  debug: true,
  resources,
});

const watchedState = onChange(appState, () => {
  const newState = appState.state;
  
  switch (newState) {
    case 'uploaded':
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18nInstance.t('feedback.uploaded');
      input.classList.remove('is-invalid');
      input.value = '';
      input.focus();
      break;
    case 'invalid':
      feedback.classList.add('text-danger');
      feedback.textContent = i18nInstance.t('feedback.invalid');
      input.classList.add('is-invalid');
      break;
    case 'exists':
      feedback.classList.add('text-danger');
      feedback.textContent = i18nInstance.t('feedback.exists');
      input.classList.add('is-invalid');
      break;
    case 'uploading':
      
      break;
    default:
      throw new Error(`Unknown state: ${newState}`);
  }
});

export { form, input, watchedState };