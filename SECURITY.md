# Security Policy

If you think you found a security issue in this repo, report it privately.
Do not open a public issue for security problems.

## How to report

Email `contact@adriamics.com` with:

- A short description of the issue.
- Why it matters.
- Steps to reproduce, if you have them.
- Any relevant file names, URLs, or screenshots.

## What to expect

We will review reports as soon as we can and reply with next steps if the
issue looks valid.

## Transport Security

This site enforces HTTPS at the Cloudflare edge. `Strict-Transport-Security`
is configured outside the repository and should be applied globally to the
zone with:

`max-age=31536000; includeSubDomains; preload`

That policy applies only to secure responses. HTTP requests should continue to
redirect to HTTPS.

Please do not:

- Expose user data beyond what is needed to show the problem.
- Try to disrupt the site or its hosting.
- Share the issue publicly before we have a chance to review it.
