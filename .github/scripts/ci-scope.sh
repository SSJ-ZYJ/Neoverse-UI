#!/usr/bin/env bash
set -euo pipefail

# An open PR owns branch validation; keep its merge-commit checks independent.
if [[ "$EVENT_NAME" == push ]]; then
  if open_prs=$(gh api --method GET "repos/$REPOSITORY/pulls" \
    -f state=open -f "head=$REPOSITORY_OWNER:$BRANCH_NAME" --jq 'length'); then
    if (( open_prs > 0 )); then
      echo 'verify=false' >> "$GITHUB_OUTPUT"
      echo 'full-checks=false' >> "$GITHUB_OUTPUT"
      echo 'The open PR will verify this branch.'
      exit 0
    fi
  else
    echo 'PR lookup failed; running branch checks.'
  fi
fi

echo 'verify=true' >> "$GITHUB_OUTPUT"
full_checks=true
if [[ "$EVENT_NAME" != workflow_dispatch && -n "${BASE_SHA:-}" ]] && \
  git cat-file -e "$BASE_SHA^{commit}" 2>/dev/null; then
  changed_files=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA")
  full_checks=false
  while IFS= read -r changed_file; do
    case "$changed_file" in
      docs/component-contract-matrix.md|.github/workflows/*|.github/scripts/*)
        full_checks=true ;;
      *.md|.github/ISSUE_TEMPLATE/*|'') ;;
      *) full_checks=true ;;
    esac
  done <<< "$changed_files"
fi
echo "full-checks=$full_checks" >> "$GITHUB_OUTPUT"
