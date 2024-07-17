import onChange from "on-change";

const form = document.querySelector('form');
const input = form.querySelector('input');
const feedback = document.querySelector('.feedback');

const appState = { // 4 states: uploaded, exists, invalid, uploading
  feeds: [],
  state: 'uploaded',
};

const watchedState = onChange(appState, () => {
  const newState = appState.state;
  
  switch (newState) {
    case 'uploaded':
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = 'RSS успешно загружен';
      input.classList.remove('is-invalid');
      input.value = '';
      input.focus();
      break;
    case 'invalid':
      feedback.classList.add('text-danger');
      feedback.textContent = 'Ссылка должна быть валидным URL';
      input.classList.add('is-invalid');
      break;
    case 'exists':
      feedback.classList.add('text-danger');
      feedback.textContent = 'RSS уже существует';
      input.classList.add('is-invalid');
      break;
    case 'uploading':
      
      break;
    default:
      throw new Error(`Unknown state: ${newState}`);
  }
});

export { form, input, watchedState };