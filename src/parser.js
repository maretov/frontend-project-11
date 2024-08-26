export default (string, format) => {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(string, format);

  if (parsed.querySelector('parsererror')) {
    return 'parsererror';
  }

  const feedItem = parsed.querySelector('channel');
  const feedTitle = feedItem.querySelector('title').textContent;
  const feedDescription = feedItem.querySelector('description').textContent;
  const feed = { feedTitle, feedDescription };

  const postsItems = feedItem.querySelectorAll('item');
  const posts = [];
  postsItems.forEach((post) => {
    const postUrl = post.querySelector('link').textContent;
    const postTitle = post.querySelector('title').textContent;
    const postDescription = post.querySelector('description').textContent;
    posts.push({ postUrl, postTitle, postDescription });
  });

  return { feed, posts };
};
