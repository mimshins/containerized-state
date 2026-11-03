# Release

## How it works

Merging to `main` runs `.github/workflows/release.yml`:

1. With changesets pending, `version` opens or updates the "chore: bump
   versions" pull request.
2. Merging that pull request leaves a version unpublished, so `pack` runs the
   whole `pnpm check` and packs the tarballs.
3. `publish`, in the `release` environment, publishes them with npm trusted
   publishing and provenance, then pushes the tags and GitHub releases.

## One-time setup

Do these **before merging the first bump pull request** after this workflow
lands:

1. On npmjs.com, for each of `containerized-state`, `react-containerized-state`,
   and `containerized-state-plugin-persistence`, add a trusted publisher:
   repository `mimshins/containerized-state`, workflow `release.yml`,
   environment `release`.
2. In the repository settings, Actions > General: allow GitHub Actions to create
   and approve pull requests.
3. Optional: give the `release` environment required reviewers, to approve every
   publish.
4. After the first successful publish, delete the `NPM_AUTH_TOKEN` repository
   secret and revoke the token.
5. Recommended: require the `ci-ok` check on `main` with a ruleset; `main` has
   no protection today.

## If a publish fails

A failed `publish` job leaves the version unpublished and the `pack` artifact in
place: fix the cause and re-run the failed jobs. Nothing else re-triggers it,
because later pushes select `publish` mode again only while a version is
unpublished.
