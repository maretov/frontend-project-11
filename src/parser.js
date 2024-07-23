const parseRss = (string, format) => {
  const parser = new DOMParser();
  return parser.parseFromString(string, format);
};

export { parseRss };
