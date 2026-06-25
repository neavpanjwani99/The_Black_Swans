## TODO
- [ ] Defer Groq client initialization in `server/src/routes/ai.ts` so missing `GROQ_API_KEY` does not crash server startup.
- [ ] Add a runtime guard that returns a clear 500 error when `GROQ_API_KEY` is missing/empty.
- [ ] Keep existing endpoint behavior otherwise.
- [ ] Run a quick server start check to confirm the crash is resolved.
