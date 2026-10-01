require('dotenv').config();
const createApp = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🦊 Foxium backend listening on port ${PORT}`);
});
