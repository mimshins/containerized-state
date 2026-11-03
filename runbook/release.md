# Release

## How it works

Merging to `main` runs `.github/workflows/release.yml`:

1. With changesets pending, `version` opens or updates the "chore: bump
   versions" pull request.
2. Merging that pull request leaves a version unpublished, so `pack` runs the
   whole `pnpm check` and packs the tarballs.
3. `publish`, in the `release` environment, publishes them with npm trusted
   publishing, then pushes the tags and GitHub releases.

## One-time setup

Do these **before merging the first bump pull request** after this workflow
lands:

1. On npmjs.com, for each of `containerized-state`, `react-containerized-state`,
   and `containerized-state-plugin-persistence`, add a trusted publisher:
   repository `mimshins/containerized-state`, workflow `release.yml`,
   environment `release`. Under **Allowed actions**, turn on direct publishing
   with `npm publish`: a publisher created after Sep 3, 2026 allows only
   `npm stage publish` by default, and `publish` publishes directly. npm does
   not check these values when you save them.
2. In the repository settings, Actions > General: allow GitHub Actions to create
   and approve pull requests.
3. Optional: give the `release` environment required reviewers, to approve every
   publish.
4. After the first successful publish, delete the `NPM_AUTH_TOKEN` repository
   secret and revoke the token.
5. Recommended: require the `ci-ok` check on `main` with a ruleset; `main` has
   no protection today.

## The bump pull request has no CI

The job token opens it, and GitHub starts no workflow for a pull request made
with that token. So if `main` requires `ci-ok`, the check never reports on it.
Run CI on the branch first with
`gh workflow run ci.yml --ref changeset-release/main`, check the result, and
merge with an admin bypass if the status does not attach.

## If a publish fails

A failed `publish` job leaves the version unpublished: fix the cause and re-run
the failed jobs. Any later push to `main` also selects `publish` mode again
while a version is unpublished.

Two errors point at a package's trusted publisher on npmjs.com:

- `403 OIDC permission denied for this action`: direct publishing is not turned
  on under **Allowed actions**.
- `404 Not found`: the publisher is missing, or a value does not match exactly.
  All of them are case-sensitive.

## Check the first release

Trusted publishing and provenance can only be proven by a real publish. After
the first one, check whether each package's npm page shows provenance.
