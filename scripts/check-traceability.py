#!/usr/bin/env python3
import os
import re
import sys

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    spec_path = os.path.join(base_dir, "docs", "lab-03", "specification.md")
    tests_path = os.path.join(base_dir, "docs", "lab-03", "tests.md")

    if not os.path.exists(spec_path):
        print(f"ERROR: Specification not found at {spec_path}", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(tests_path):
        print(f"ERROR: tests.md not found at {tests_path}", file=sys.stderr)
        sys.exit(1)

    with open(spec_path, "r", encoding="utf-8") as f:
        spec_text = f.read()

    with open(tests_path, "r", encoding="utf-8") as f:
        tests_text = f.read()

    # 1. Parse defined AC, FR, BR from specification.md
    defined_acs = set(re.findall(r"\b(AC-\d{2})\b", spec_text))
    defined_frs = set(re.findall(r"\b(FR-\d{2})\b", spec_text))
    defined_brs = set(re.findall(r"\b(BR-\d{2})\b", spec_text))

    print(f"=== Specification Definition Audit ===")
    print(f"Defined Acceptance Criteria: {len(defined_acs)} ({', '.join(sorted(defined_acs))})")
    print(f"Defined Functional Reqs:     {len(defined_frs)} ({', '.join(sorted(defined_frs))})")
    print(f"Defined Business Rules:      {len(defined_brs)} ({', '.join(sorted(defined_brs))})")

    # 2. Parse referenced AC, FR, BR from tests.md table
    # Only inspect the Requirement / AC column or lines inside the traceability table
    table_lines = [line for line in tests_text.splitlines() if line.strip().startswith("|") and ("API-" in line or "UT-" in line or "UI-" in line or "MT-" in line or "E2E-" in line)]
    
    referenced_acs = set()
    referenced_frs = set()
    referenced_brs = set()
    unknown_ids = set()

    for line in table_lines:
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 4:
            req_col = parts[3]
            for ac in re.findall(r"\b(AC-\d{2})\b", req_col):
                referenced_acs.add(ac)
                if ac not in defined_acs:
                    unknown_ids.add(ac)
            for fr in re.findall(r"\b(FR-\d{2})\b", req_col):
                referenced_frs.add(fr)
                if fr not in defined_frs:
                    unknown_ids.add(fr)
            for br in re.findall(r"\b(BR-\d{2})\b", req_col):
                referenced_brs.add(br)
                if br not in defined_brs:
                    unknown_ids.add(br)

    print(f"\n=== Traceability Matrix Coverage Audit ===")
    print(f"Referenced Acceptance Criteria: {len(referenced_acs)} ({', '.join(sorted(referenced_acs))})")
    print(f"Referenced Functional Reqs:     {len(referenced_frs)} ({', '.join(sorted(referenced_frs))})")
    print(f"Referenced Business Rules:      {len(referenced_brs)} ({', '.join(sorted(referenced_brs))})")

    uncovered_acs = defined_acs - referenced_acs
    uncovered_frs = defined_frs - referenced_frs
    uncovered_brs = defined_brs - referenced_brs

    errors = []
    if uncovered_acs:
        errors.append(f"Uncovered ACs with no test: {sorted(uncovered_acs)}")
    if uncovered_frs:
        errors.append(f"Uncovered FRs with no test: {sorted(uncovered_frs)}")
    if uncovered_brs:
        errors.append(f"Uncovered BRs with no test: {sorted(uncovered_brs)}")
    if unknown_ids:
        errors.append(f"Unknown IDs referenced in tests.md: {sorted(unknown_ids)}")

    if errors:
        print("\n❌ TRACEABILITY VERIFICATION FAILED:")
        for err in errors:
            print("  - " + err)
        sys.exit(1)
    else:
        max_ac = max([int(x.split('-')[1]) for x in defined_acs]) if defined_acs else 0
        max_fr = max([int(x.split('-')[1]) for x in defined_frs]) if defined_frs else 0
        max_br = max([int(x.split('-')[1]) for x in defined_brs]) if defined_brs else 0
        print(f"\n✅ ALL ACCEPTANCE CRITERIA (AC-01..AC-{max_ac:02d}), FUNCTIONAL REQUIREMENTS (FR-01..FR-{max_fr:02d}), AND BUSINESS RULES (BR-01..BR-{max_br:02d}) ARE 100% COVERED WITHOUT ORPHAN REFERENCES.")
        sys.exit(0)

if __name__ == "__main__":
    main()
