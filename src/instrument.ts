import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://851f72a6c1e950b1dc97c2816753c053@o4509094340984832.ingest.us.sentry.io/4510144521437185",

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,

  // Enable performance monitoring
  tracesSampleRate: 1.0,

  // Environment configuration
  environment: process.env.NODE_ENV || "development",

  // Release tracking - use git commit SHA or package version
  release: process.env.SENTRY_RELEASE || `backend@${process.env.npm_package_version || "unknown"}`,

  // Enable distributed tracing - Sentry will automatically capture incoming trace headers
});
