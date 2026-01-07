import "dotenv/config";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: process.env.PORT ?? 3000,
  REDIS_URL: required("REDIS_URL"),
  KAFKA_URL: required("KAFKA_URL"),
  JWT_SECRET: required("JWT_SECRET"),
};
