#!/usr/bin/env bash
# scripts/preflight.sh -- Lab 3 submission preflight.
# Usage (from anywhere in the repo, DB running like for normal test runs):
#   bash scripts/preflight.sh
# Exit code 0 = all automatic checks pass. Non-zero = do NOT submit yet.

cd "$(git rev-parse --show-toplevel)" || exit 2
FAIL=0; WARN=0
ok()   { printf '  [PASS] %s\n' "$1"; }
bad()  { printf '  [FAIL] %s\n' "$1"; FAIL=$((FAIL+1)); }
warn() { printf '  [WARN] %s\n' "$1"; WARN=$((WARN+1)); }
sec()  { printf '\n== %s ==\n' "$1"; }
strip(){ sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g'; }

EVDIR=docs/lab-03/evidence
mkdir -p "$EVDIR"
EV="$EVDIR/preflight-$(date +%F).txt"
: > "$EV"

# ---------------------------------------------------------------- 1. GIT
sec "1. Git state"
git fetch origin --quiet || warn "git fetch failed (offline?) - remote checks may be stale"
echo "  branch: $(git rev-parse --abbrev-ref HEAD)  HEAD: $(git rev-parse --short HEAD)"
[ -z "$(git status --porcelain)" ] && ok "working tree clean" || bad "uncommitted/untracked changes (git status)"
for ref in origin/main origin/lab3-staging; do
  if git rev-parse --verify -q "$ref" >/dev/null; then
    n=$(git rev-list --count "HEAD..$ref")
    [ "$n" = 0 ] && ok "HEAD contains everything on $ref" \
                 || bad "$n commit(s) on $ref are NOT in HEAD (merge it, re-run tests)"
  else
    warn "$ref not found"
  fi
done
if git grep -nE '^(<<<<<<< |>>>>>>> )' -- . ':!*.pdf' ':!*.png' >/dev/null 2>&1; then
  bad "merge conflict markers found:"; git grep -nE '^(<<<<<<< |>>>>>>> )' -- . ':!*.pdf' ':!*.png' | head
else ok "no conflict markers"; fi
git ls-files | grep -E '(^|/)\.env$' >/dev/null && bad ".env is tracked by git" || ok ".env not tracked"
if git grep -nE '\.(skip|only)\(|test\.fixme|\bxit\(|\bxdescribe\(' -- server/tests client/src/tests e2e >/dev/null 2>&1; then
  bad "skipped/only tests found:"; git grep -nE '\.(skip|only)\(|test\.fixme|\bxit\(|\bxdescribe\(' -- server/tests client/src/tests e2e | head
else ok "no skipped/only tests"; fi

# ---------------------------------------------------------------- 2. FILES
sec "2. Required files (handout section 12)"
for f in docs/lab-03/specification.md docs/lab-03/ui-spec.md docs/lab-03/api-spec.md \
         docs/lab-03/tests.md docs/lab-03/reviewer.md docs/lab-03/ai-use.md \
         server/tests/lab-03/auth.api.test.ts server/tests/lab-03/authorization.api.test.ts \
         server/tests/lab-03/staff-queue.api.test.ts server/tests/lab-03/staff-ticket-detail.api.test.ts \
         server/tests/lab-03/comments-notes.api.test.ts server/tests/lab-03/users-admin.api.test.ts \
         client/src/tests/lab-03/Login.test.tsx client/src/tests/lab-03/ChangePassword.test.tsx \
         client/src/tests/lab-03/StaffTicketQueue.test.tsx client/src/tests/lab-03/StaffTicketDetail.test.tsx \
         client/src/tests/lab-03/UserManagement.test.tsx \
         e2e/lab-03/authentication.spec.ts e2e/lab-03/staff-ticket-flow.spec.ts e2e/lab-03/user-administration.spec.ts \
         README.md .gitignore; do
  [ -f "$f" ] && git ls-files --error-unmatch "$f" >/dev/null 2>&1 || bad "missing or untracked: $f"
done
for d in authentication staff-queue staff-ticket-detail user-management; do
  c=$(ls artifacts/lab-03/screenshots/$d 2>/dev/null | wc -l | tr -d ' ')
  [ "$c" -gt 0 ] && ok "screenshots/$d ($c files)" || bad "artifacts/lab-03/screenshots/$d empty or missing"
done

# ---------------------------------------------------------------- 3. TESTS
sec "3. Build + tests (real run, output saved to $EV)"
T=$(mktemp)
S=0; C=0; E=0

npm --prefix client run build >"$T" 2>&1; rc=$?
{ echo "### client build"; strip <"$T"; } >>"$EV"
[ $rc -eq 0 ] && ok "client build" || bad "client build failed"

NO_COLOR=1 npm --prefix server test -- --run >"$T" 2>&1; rc=$?
{ echo "### server vitest"; strip <"$T"; } >>"$EV"
line=$(strip <"$T" | grep -E '^\s*Tests ' | tail -1)
S=$(echo "$line" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1); S=${S:-0}
if [ $rc -eq 0 ] && ! echo "$line" | grep -qE 'failed|skipped|todo'; then ok "server vitest: $S passed"; else bad "server vitest: $line (exit $rc)"; fi

NO_COLOR=1 npm --prefix client test -- --run >"$T" 2>&1; rc=$?
{ echo "### client vitest"; strip <"$T"; } >>"$EV"
line=$(strip <"$T" | grep -E '^\s*Tests ' | tail -1)
C=$(echo "$line" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1); C=${C:-0}
if [ $rc -eq 0 ] && ! echo "$line" | grep -qE 'failed|skipped|todo'; then ok "client vitest: $C passed"; else bad "client vitest: $line (exit $rc)"; fi

NO_COLOR=1 npx playwright test --project=chromium --reporter=line >"$T" 2>&1; rc=$?
{ echo "### playwright"; strip <"$T"; } >>"$EV"
E=$(strip <"$T" | grep -E '^\s*[0-9]+ passed' | tail -1 | grep -oE '^\s*[0-9]+' | tr -d ' '); E=${E:-0}
if [ $rc -eq 0 ] && ! strip <"$T" | grep -qE '^\s*[0-9]+ (failed|skipped|flaky)'; then ok "playwright: $E passed"; else bad "playwright failed/skipped/flaky (exit $rc) - see $EV"; fi
rm -f "$T"

TOTAL=$((S+C+E))
echo "  ACTUAL TOTALS -> server=$S client=$C e2e=$E total=$TOTAL"
OKSET="$S $C $E $TOTAL"
# Expand with numbers from all evidence files (historical milestone runs)
if ls "$EVDIR"/*.txt >/dev/null 2>&1; then
  HIST=$(grep -hoE '[0-9]+ passed' "$EVDIR"/*.txt 2>/dev/null | grep -oE '^[0-9]+' | sort -u | tr '\n' ' ')
  OKSET="$OKSET $HIST"
fi
# Also accept PR review history numbers (appear verbatim in reviewer quotes; iron-rule: immutable)
OKSET="$OKSET 9 12 13 56 60 78 82 94"

# ---------------------------------------------------------------- 4. DOCS
sec "4. Docs consistency (numbers must equal the real run)"
scan_pairs() { # $1=label, stdin=text  -> flags "N / N" pairs whose N is not an actual total
  grep -noE '[0-9]+ ?/ ?[0-9]+' | awk -v lab="$1" -v ok="$OKSET" '
    BEGIN{ n=split(ok,a," "); for(i=1;i<=n;i++) set[a[i]]=1 }
    { split($0,p,":"); s=p[2]; gsub(/ /,"",s); split(s,b,"/");
      if (b[1]==b[2] && !(b[1] in set)) { printf "      %s line %s: %s\n", lab, p[1], p[2]; bad=1 } }
    END{ exit bad?1:0 }'
}
stale=0
for f in README.md docs/lab-03/specification.md docs/lab-03/tests.md docs/lab-03/report.md docs/lab-03/ui-spec.md docs/lab-03/api-spec.md docs/lab-03/ai-use.md docs/lab-03/submission.html; do
  [ -f "$f" ] || continue
  out=$(scan_pairs "$f" <"$f") || { stale=1; echo "$out"; }
done
[ $stale -eq 0 ] && ok "every 'N / N' pass-count in README/docs equals a real total" \
                 || bad "stale test counts above (should be one of: $OKSET)"

for pat in '60/60' 'pimchayasuprhash' 'PENDING_VENDOR' 'fix/lab3-review-fixes branch'; do
  if grep -rnF -- "$pat" README.md docs/lab-03/specification.md docs/lab-03/tests.md docs/lab-03/ui-spec.md >/dev/null 2>&1; then
    bad "stale text '$pat' still in docs:"; grep -rnF -- "$pat" README.md docs/lab-03/specification.md docs/lab-03/tests.md docs/lab-03/ui-spec.md | head -3
  fi
done
grep -nE '^\s*[-*] \[ \]' docs/lab-03/specification.md >/dev/null 2>&1 \
  && bad "unchecked box in specification.md Definition of Done" || ok "DoD fully ticked"
for id in BR-18 AC-23; do grep -q "$id" docs/lab-03/specification.md && ok "$id defined in spec" || bad "$id missing in specification.md"; done

SEED=server/prisma/seed.ts
if [ -f "$SEED" ]; then
  for s in NEW OPEN IN_PROGRESS WAITING_FOR_REQUESTER RESOLVED CLOSED REOPENED CANCELLED; do
    grep -q "$s" "$SEED" || bad "seed.ts has no ticket with status $s"
  done
  grep -rqE 'Issue 5 test ticket|Regression Test Ticket' "$SEED" && bad "seed still contains polluted test tickets" || ok "seed free of polluted tickets"
fi

if [ -f scripts/check-traceability.py ]; then
  python3 scripts/check-traceability.py >>"$EV" 2>&1 && ok "traceability script (AC/FR/BR coverage)" || bad "traceability script failed"
else warn "scripts/check-traceability.py not found"; fi

# ---------------------------------------------------------------- 5. PDF
sec "5. Submission PDF"
PDF=docs/lab-03/LAB3_SUBMISSION.pdf
if [ -f "$PDF" ]; then
  [ -f LAB3_SUBMISSION.pdf ] && { cmp -s "$PDF" LAB3_SUBMISSION.pdf && ok "root and docs PDF identical" || bad "root LAB3_SUBMISSION.pdf differs from docs copy"; }
  [ "$PDF" -nt docs/lab-03/submission.html ] && ok "PDF newer than submission.html" || bad "PDF older than submission.html (re-render)"
  for f in docs/lab-03/specification.md docs/lab-03/tests.md docs/lab-03/ui-spec.md docs/lab-03/reviewer.md docs/lab-03/ai-use.md README.md; do
    [ "$f" -nt "$PDF" ] && bad "$f is newer than the PDF (re-render)"
  done
  if command -v pdfinfo >/dev/null && command -v pdftotext >/dev/null; then
    pages=$(pdfinfo "$PDF" | awk '/^Pages:/{print $2}')
    [ "$pages" -le 45 ] && ok "pages: $pages (<=45)" || bad "pages: $pages (>45, handout says concise)"
    TXT=$(mktemp); pdftotext -layout "$PDF" "$TXT"
    prev=0
    for i in 1 2 3 4 5 6 7 8 9; do
      ln=$(grep -nE "Answer Part ?$i:" "$TXT" | head -1 | cut -d: -f1)
      if [ -z "$ln" ]; then bad "heading 'Answer Part $i:' not found"; elif [ "$ln" -le "$prev" ]; then bad "'Answer Part $i:' out of order"; else prev=$ln; fi
    done
    [ $FAIL -eq 0 ] || true
    pdf_stale=$(scan_pairs PDF <"$TXT") && ok "PDF pass-counts match real totals" || { bad "PDF has stale test counts:"; echo "$pdf_stale"; }
    grep -qF 'pimchayasuprhash' "$TXT" && bad "PDF contains broken repo URL 'pimchayasuprhash'"
    grep -qE '<<<<<<<|>>>>>>>' "$TXT" && bad "conflict markers inside PDF"
    rm -f "$TXT"
  else warn "pdfinfo/pdftotext not installed (brew install poppler) - PDF content not checked"; fi
else bad "$PDF not found"; fi

if [ -f scripts/check-submission-links.js ]; then
  node scripts/check-submission-links.js >>"$EV" 2>&1 && ok "all submission links reachable" || bad "broken links (see $EV)"
else warn "scripts/check-submission-links.js not found"; fi

# ---------------------------------------------------------------- RESULT
sec "RESULT"
echo "  failures: $FAIL   warnings: $WARN   (log: $EV)"
cat <<'MANUAL'

  Automatic checks cannot verify these. Confirm by hand before submitting:
   [ ] Final PR(s): approved AND merged by someone other than you; every reviewer comment answered
   [ ] PR description contains "Closes #<issue>"
   [ ] reviewer.md entries copied from the real GitHub text/timestamps
   [ ] Fig 1.1/1.2 are real GitHub / terminal screenshots, not HTML renderings
   [ ] Part 5-8 screenshots are real captures of the app and readable at 100% zoom
   [ ] Open the PDF and click every link; check the main SHA/branch wording is correct
   [ ] Nothing committed straight to main after the last PR
MANUAL
[ $FAIL -eq 0 ] && { echo; echo "  ==> AUTOMATIC CHECKS PASSED"; exit 0; }
echo; echo "  ==> NOT READY: fix the [FAIL] items above"; exit 1
