import { createApp } from "./src/app";

const server = createApp();

server.listen(3003, () => {
  console.log(`Server running on 3003`);
});
