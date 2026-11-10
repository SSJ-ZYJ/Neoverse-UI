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
        echo 'browser-checks=false'
      } >> "$GITHUB_OUTPUT"
      echo 'The open PR will verify this branch.'
      exit 0
    fi
  else
    echo 'PR lookup failed; running branch checks.'
  fi
fi

echo 'verify=true' >> "$GITHUB_OUTPUT"

# Release asks whether the pull request behind this main push already passed CI.
# The lookup fails closed: any error reports `ci-verified=false`, which keeps the
# release verification instead of silently trusting an unproven commit.
if [[ "${CI_VERIFIED_CHECK:-false}" == true && "$EVENT_NAME" == push ]]; then
  if ci_verified=$(node .github/scripts/ci-evidence.mjs "$HEAD_SHA"); then
    echo "$ci_verified" >> "$GITHUB_OUTPUT"
  else
    echo 'ci-verified=false' >> "$GITHUB_OUTPUT"
    echo 'CI evidence lookup failed; keeping release verification.'
  fi
fi

if [[ "$EVENT_NAME" != workflow_dispatch && -n "${BASE_SHA:-}" ]] &&
  git cat-file -e "$BASE_SHA^{commit}" 2>/dev/null; then
  node .github/scripts/ci-classify.mjs "$BASE_SHA" "$HEAD_SHA" >> "$GITHUB_OUTPUT"
else
  # Missing history or explicit manual runs must never silently lose coverage.
  {
    echo 'metadata-checks=true'
    echo 'quality-checks=true'
    echo 'browser-checks=true'
  } >> "$GITHUB_OUTPUT"
fi
