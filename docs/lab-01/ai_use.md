# AI Use and Reflection

I used the Antigravity coding agent. I mainly used Gemini as the LLM.

**Selected Key Prompts:**

| Prompt Name | Actual Prompt Text |
| :--- | :--- |
| Set Up Full-Stack Project | "Act as an expert full-stack developer... I need to implement Issue 1: Set up the TokTickIT project foundation..." |
| Implement Health Check | "Act as an expert backend developer... implement Issue 2: API Health Check. Update app.ts to include GET /api/health..." |
| Fix Database Connection | "The database migration failed with Error P1010. Please check the .env database URL and fix the connection issue..." |
| Implement Category Seed | "Act as an expert backend developer... implement Issue 3. Update schema.prisma to include a Category model and create a seed script..." |
| Build and Test Check System UI | "Act as an expert full-stack developer... implement Issue 4. Add GET /api/categories endpoint and update React component using Bootstrap..." |
| GitHub Workflow Help | "How to fix 'lab1-staging had recent pushes' when creating a pull request?" |

**My Reflection:**
The AI was incredibly helpful in generating boilerplate code and writing test cases quickly. However, I learned that I must strictly review the generated code against the Lab 1 requirements and manage GitHub PR flows effectively.

* **Key Challenge & Problem Solving (PR Review Workflow Strategy):**
  - **The Issue:** After completing the project code, PRs were accidentally merged into `lab1-staging` before peer review approvals were recorded on GitHub, making the official green "Approve" button unavailable.
  - **The Strategy:** Instead of resetting or rebuilding the project (as code, issues, and test suites were fully valid), we established a dedicated review branch workflow (`-review` suffix branches) to capture valid peer review records.
  - **Overcoming Git Diff Restrictions:** To resolve GitHub's *"There isn't anything to compare"* error when creating PRs for identical codebases, minor documentation formatting changes (e.g., whitespace/newlines) were added to force diff detection.
  - **Repeatable Workflow:** Created `-review` branches targeted to `lab1-staging`, invited peer reviewers to comment and officially approve against acceptance criteria, replied to feedback, recorded review evidence, and systematically merged each PR.
