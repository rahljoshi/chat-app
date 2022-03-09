const generateMessage = (text) => {
  return {
    message: text.message,
    createdAt: new Date().getTime(),
    username: text.username,
  };
};

const generateLocationMessage = (url) => {
  return {
    url: url.url,
    createdAt: new Date().getTime(),
    username: url.username,
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage,
};
