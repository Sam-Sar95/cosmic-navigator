import { createServer } from "../dist/index.js";

let server;

export default async (req, res) => {
  if (!server) {
    server = await createServer();
  }
  return server(req, res);
};
