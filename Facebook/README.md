# Tisoro Facebook Content Scheduler — not yet built

Per the agreed approach, the LinkedIn implementation (`../LinkedIn/`) was
built first as a complete, working reference: Next.js frontend, .NET 8
backend, PostgreSQL via EF Core, real LinkedIn OAuth + Community Management
API integration, a background publisher, and a tested, documented setup.

This folder will follow the same structure and pattern once the Facebook
side is scoped against the Facebook content playbook spreadsheet:

```
Facebook/
  backend/    .NET 8 Web API + EF Core + Npgsql, independent database
  frontend/   Next.js app, independent configuration
```

Facebook adds a real wrinkle LinkedIn doesn't have: the playbook calls for
**webhooks** (e.g. for 24/7 live broadcast status / lead or messaging
events), which Meta requires a verified HTTPS callback URL and App Review
for — that needs to be factored into the plan before implementation starts,
the same way LinkedIn's Community Management API access requirement was
factored in here.
