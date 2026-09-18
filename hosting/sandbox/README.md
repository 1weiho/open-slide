# Autono Sandbox releases

Merging this repository into `staging` builds the fork at that commit and deploys
`autono-slides-sandbox-staging`. The image contains the application and dependencies;
Artifacts contains the editable workspace. Nothing checks GitHub on a timer.

## Release path

`.github/workflows/sandbox-staging.yml` validates, runs
`node hosting/sandbox/scripts/release.mjs`, then verifies the running revision and
app HTML. Verification checkpoints the dedicated staging workspace and restarts
it on the deployed image before checking its revision. Wrangler builds the custom Dockerfile and rolls it out. Workflow runs
are serialized and never cancel an in-progress deployment. Production is not
changed by this workflow. A rollout can outlast deployment; the verification
fails visibly if it still sees the preceding image rather than retrying silently.

The deployment token needs Containers Edit, Workers Scripts Edit, and Artifacts Edit
scoped to the Autono account. GitHub environment `staging` needs `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`, and `SANDBOX_PASSWORD`. The deployed Worker needs the
matching `AUTH_PASSWORD` secret. Tokens and passwords never enter the image.

The SDK package and Sandbox base image are pinned together at
`0.13.0-next.751.1`. Keep them on the same release line.

## Workspace behavior

The authenticated first request starts the application if needed. A cold sandbox
clones its existing Artifacts repository, attaches the image's dependencies, and
waits for the application's port using the SDK readiness API. Initializing again
does not recopy starter content over an existing workspace.

The workspace coordinator serializes browser mutations and agent file writes.
It commits slides, themes, assets, and deletions and pushes them before returning
a successful save. A push conflict or credential error returns an error; there is
no force-push, automatic merge, retry loop, or success response before persistence.
Read-only requests do not commit. Artifacts credentials are short-lived tokens
minted through its Worker binding, not a manually maintained expiring token.

Agent endpoints (same authentication as the app):

- `GET /__host/release`: running application commit.
- `GET /__host/files?path=slides/deck/index.tsx`: read source.
- `PUT /__host/files?path=slides/deck/index.tsx`: write the text body and persist it.
- `POST /__host/checkpoint`: persist content before maintenance.
- `POST /__host/restart`: checkpoint and destroy; the next request restores it.

Only acknowledged saves are guaranteed durable. A crash during an unfinished
request can lose that unacknowledged write. Direct shell writes bypass the save
contract; agents should use the file API, or explicitly checkpoint their work.

## Staging scope

This first deployment uses a separate Artifacts repo, `autono-slides-staging`,
seeded from the reviewed pilot. It retains pilot Basic Auth and one workspace;
it does not move existing Buttons app domains or production agents. The host's
command and content roots are configuration, so other apps can use the same
hosting contract. Platform identity, per-agent routing, and admin template
provisioning remain the next integration layer.

To prepare another workspace, create/fork its Artifacts repo with a `main` branch
from the approved template before configuring `WORKSPACE_ID` and its returned
`ARTIFACTS_REMOTE`. The current beta repo handle does not expose the remote URL
over RPC, despite the generated type. App releases never
seed over existing files. The demo content inside the image is not the live data
store.

## Verification

Run `pnpm --filter @autono/sandbox-host typecheck`, `pnpm check`, and `pnpm test`.
Build locally from the repository root:

```sh
docker build --platform linux/amd64 \
  --build-arg APP_REVISION="$(git rev-parse HEAD)" \
  -f hosting/sandbox/Dockerfile -t autono-slides-sandbox:test .
```

A release acceptance test must save browser and agent edits, restart the sandbox,
and read those edits back alongside the expected application revision. Never use
a production workspace for that destructive restart check.

Official references: [custom images](https://developers.cloudflare.com/sandbox/configuration/dockerfile/),
[deployment](https://developers.cloudflare.com/sandbox/guides/deploy/),
[rollouts](https://developers.cloudflare.com/containers/configuration/rollouts/),
[Artifacts binding](https://developers.cloudflare.com/artifacts/api/workers-binding/),
[process readiness](https://developers.cloudflare.com/sandbox/1-0-preview/api/processes/).
