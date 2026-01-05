import { createApp } from "./src/app";
import { env } from "./src/lib/env";

const server = createApp();

server.listen(env.PORT, () => {
  console.log(`Server running on ${env.PORT}`);
});
