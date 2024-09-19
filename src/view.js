import onChange from 'on-change';

const form = document.querySelector('form');
const input = form.querySelector('input');
const button = form.querySelector('button');
const feedback = document.querySelector('.feedback');
const mainContainer = document.querySelector('.container-xxl');
const postsContainer = mainContainer.querySelector('.posts');
const feedsContainer = mainContainer.querySelector('.feeds');

const startStateWatching = (state, i18nInstance) => {
  const makeFeedback = (feedbackClass) => {
    if (feedbackClass === 'text-success') {
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
    } else {
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
    }

    if (state.app.state === 'uploaded') {
      input.classList.remove('is-invalid');
      input.value = '';
      input.focus();
    } else {
      input.classList.add('is-invalid');
    }

    feedback.textContent = i18nInstance.t(`feedback.${state.app.state}`);
  };

  /* eslint no-param-reassign: ["error", { "props": false }] */
  const makeContainerLayout = (container, containerHeader) => {
    container.innerHTML = '';

    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    container.append(card);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    card.append(cardBody);

    const h2 = document.createElement('h2');
    h2.classList.add('card-title', 'h4');
    h2.textContent = containerHeader;
    cardBody.append(h2);

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    card.append(ul);

    return ul;
  };

  const fillFeedsContainer = (ul, feeds) => {
    feeds.forEach((feed) => {
      const { feedTitle, feedDescription } = feed;

      const li = document.createElement('li');
      li.classList.add('list-group-item', 'border-0', 'border-end-0');
      ul.append(li);

      const h3 = document.createElement('h3');
      h3.classList.add('h6', 'm-0');
      h3.textContent = feedTitle;

      const p = document.createElement('p');
      p.classList.add('m-0', 'small', 'text-black-50');
      p.textContent = feedDescription;

      li.append(h3, p);
    });
  };

  const fillPostsContainer = (ul, posts) => {
    posts.forEach((post) => {
      const { postId, postTitle, postUrl } = post;

      const li = document.createElement('li');
      li.classList.add(
        'list-group-item',
        'border-0',
        'border-end-0',
        'd-flex',
        'justify-content-between',
        'align-items-start',
      );
      ul.append(li);

      const a = document.createElement('a');
      a.href = postUrl;
      const uiPost = state.ui.posts.find((el) => el.postId === postId);
      const styleForUrl = uiPost.state === 'viewed' ? 'fw-normal' : 'fw-bold';
      a.classList.add(styleForUrl);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = postTitle;

      const postButton = document.createElement('button');
      postButton.type = 'button';
      postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      postButton.id = postId;
      postButton.dataset.bsToggle = 'modal';
      postButton.dataset.bsTarget = '#modal';
      postButton.textContent = i18nInstance.t('posts.postButton');

      li.append(a, postButton);
    });
  };

  const changeUrlStyle = (id) => {
    const currentButton = document.getElementById(id);
    const currentPostUrl = currentButton.previousSibling;
    currentPostUrl.classList.replace('fw-bold', 'fw-normal');
  };

  const watchedState = onChange(state, (path) => {
    const splittedPath = path.split('.');

    switch (splittedPath[0]) {
      case 'app':
        if (splittedPath[1] === 'state') {
          switch (state.app.state) {
            case 'uploaded':
              button.disabled = false;
              makeFeedback('text-success', 'uploaded');

              if (state.app.feeds.length > 0) {
                const postsContainerHeader = i18nInstance.t('postsContainerHeader');
                const postsUlContainer = makeContainerLayout(postsContainer, postsContainerHeader);
                fillPostsContainer(postsUlContainer, state.app.posts);

                const feedsContainerHeader = i18nInstance.t('feedsContainerHeader');
                const feedsUlContainer = makeContainerLayout(feedsContainer, feedsContainerHeader);
                fillFeedsContainer(feedsUlContainer, state.app.feeds);
              }

              break;
            case 'updated':
              button.disabled = false;
              if (state.app.feeds.length > 0) {
                const postsContainerHeader = i18nInstance.t('postsContainerHeader');
                const postsUlContainer = makeContainerLayout(postsContainer, postsContainerHeader);
                fillPostsContainer(postsUlContainer, state.app.posts);

                const feedsContainerHeader = i18nInstance.t('feedsContainerHeader');
                const feedsUlContainer = makeContainerLayout(feedsContainer, feedsContainerHeader);
                fillFeedsContainer(feedsUlContainer, state.app.feeds);
              }
              break;
            case 'invalidUrl':
              makeFeedback('text-danger', 'invalidUrl');
              break;
            case 'invalidRss':
              button.disabled = false;
              makeFeedback('text-danger', 'invalidRss');
              break;
            case 'networkError':
              button.disabled = false;
              makeFeedback('text-danger', 'networkError');
              break;
            case 'exists':
              makeFeedback('text-danger', 'exists');
              break;
            case 'uploading':
              button.disabled = true;
              break;
            default:
              throw new Error(`Unknown state: ${state.app.state}`);
          }
        }
        break;
      case 'ui':

        switch (splittedPath[1]) {
          case 'modalId': {
            const modalPostId = state.ui.modalId;
            const modalPost = state.app.posts.find((post) => post.postId === modalPostId);
            const { postTitle, postDescription, postUrl } = modalPost;

            const modal = document.querySelector('.modal');
            const modalTitle = modal.querySelector('.modal-title');
            const modalBody = modal.querySelector('.modal-body');
            const modalButton = modal.querySelector('a');

            modalTitle.textContent = postTitle;
            modalBody.textContent = postDescription;
            modalButton.href = postUrl;

            changeUrlStyle(modalPostId);
            break;
          }
          case 'posts':
            if (splittedPath[2]) {
              const changedPost = state.ui.posts[splittedPath[2]];
              const { postId } = changedPost;
              changeUrlStyle(postId);
            }
            break;
          default:
            throw new Error(`Full path: ${splittedPath}. Unknown part of path: ${splittedPath[1]}`);
        }

        break;
      default:
        throw new Error(`Full path: ${splittedPath}. Unknown part of path: ${splittedPath[0]}`);
    }
  });

  return watchedState;
};

export {
  form,
  input,
  startStateWatching,
  postsContainer,
};
