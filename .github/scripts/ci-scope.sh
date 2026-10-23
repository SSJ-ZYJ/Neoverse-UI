#!/usr/bin/env bash
set -euo pipefail

# An open PR owns branch validation; keep its merge-commit checks independent.
# Release uses this classifier too, without suppressing main push checks.
if [[ "${EVENT_NAME}" == push && "${SKIP_OPEN_PR_CHECK:-false}" != true ]]; then
  if open_prs=$(gh api --method GET "repos/$REPOSITORY/pulls" \
    -f state=open -f "head=$REPOSITORY_OWNER:$BRANCH_NAME" --jq 'length'); then
    if (( open_prs > 0 )); then
      {
        echo 'verify=false'
        echo 'metadata-checks=false'
        echo 'quality-checks=false'
        echo 'visual-checks=false'
      } >> "$GITHUB_OUTPUT"
      echo 'The open PR will verify this branch.'
      exit 0
    fi
  else
    echo 'PR lookup failed; running branch checks.'
  fi
fi

echo 'verify=true' >> "$GITHUB_OUTPUT"

if [[ "$EVENT_NAME" != workflow_dispatch && -n "${BASE_SHA:-}" ]] &&
  git cat-file -e "$BASE_SHA^{commit}" 2>/dev/null; then
  node .github/scripts/ci-classify.mjs "$BASE_SHA" "$HEAD_SHA" >> "$GITHUB_OUTPUT"
else
  # Missing history or explicit manual runs must never silently lose coverage.
  {
    echo 'metadata-checks=true'
    echo 'quality-checks=true'
    echo 'visual-checks=true'
  } >> "$GITHUB_OUTPUT"
fi
