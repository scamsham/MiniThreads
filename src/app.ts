import express from "express";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", async (req, res, next) => {
    res.status(200).json({
      ok: true,
    });
  });

  return app;
}
