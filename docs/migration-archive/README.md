# Original account migration archive

This directory preserves the original rehearsal-store repository's public
metadata and both pull requests before the original account disappears. All
original Git branches, commits and AI Studio source assets are retained in this
repository. There were no tags, releases, ordinary issues, wiki repository,
Actions runs or artifacts when captured. No Git LFS objects or submodules were
found across the full Git history.

See [the captured PR index](source/README.md), per-PR descriptions, reviews,
comments, timelines, file lists and commit metadata. Diff and multi-commit patch
files are gzip-compressed without truncation:

```sh
gunzip -c source/pulls/1/changes.patch.gz > pr-1.patch
```

Historical source URLs and authors are attribution, not execution dependencies.
This archive does not recreate GitHub review/check IDs, author identities,
stars, permissions, secrets, webhooks or account credentials. The local full
mirror/bundle includes the original PR head/merge refs as archival evidence.

The canonical personal repository is https://github.com/rarehotdog/rehearsal-store.
Connect AI Studio Settings > GitHub to this personal repository. The measured
engine origin defaults to https://thousand-stores-personal.vercel.app and does
not depend on the original account or hackathon GCP project.
