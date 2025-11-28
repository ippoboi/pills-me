declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  // The worker module shape is not important for our usage; we just need
  // TypeScript to accept the import so pdf.js can access WorkerMessageHandler.
  const worker: unknown;
  export = worker;
}
