import express from "express";
import { authRouter } from "./routes/auth.routes";
import { allUsersRouter } from "./routes/all-users.routes";
import { auth } from "./auth/jwt";
import { postsRouter } from "./routes/posts.routes";
import { commentsRouter } from "./routes/comments.routes";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", async (req, res, next) => {
    return res.status(200).json({
      ok: true,
    });
  });

  app.use("/v1/auth", authRouter);
  app.use("/v1/posts", auth, postsRouter);
  app.use("/v1/comments", auth, commentsRouter);

  // seed user endpoint
  app.use("/all-users", allUsersRouter);

  return app;
}
