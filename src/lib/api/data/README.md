# Remaining local Academy datasets

**2026-10-16 update (ADR-073):** All six retained JSON files remain intact. IT/EN exam copies in the sibling backend now supply public answer-free questions and server scoring. Assignment briefs/practical resources remain local; progress, exam outcomes and actual submission/review records now use protected account-owned APIs. Unowned browser lesson checkmarks/draft text require explicit import, and legacy exam/approval flags are never authoritative. This source implementation requires the backend/migration release first; deployed/runtime verification is pending. See [role portals](../../../../brain/role_portals.md). Historical migration notes below refer to ADR-061.

Audited against the public Railway OpenAPI and anonymous IT/EN responses on 2026-10-11.

Course, module, and lesson content now comes from validated server API adapters. Their IT/EN JSON files have been removed, including the lesson generator and mock fallbacks. Learning pages read `/courses/{slug}/modules`, `/modules/{id}`, `/modules/{id}/lessons`, `/lessons`, and `/lessons/{id}/adjacent`. Local progress uses the returned lesson IDs and module relationships.

The client explicitly requested that these six JSON files stay temporarily because the current OpenAPI exposes no matching exam, assignment, or practical-resource endpoints:

| Dataset in `it/` and `en/` | Current consumer | Contents retained |
| --- | --- | --- |
| `exams.json` | `../exams.ts` → learning page / `ExamPlaceholder` | Five exam definitions, questions, answers, explanations |
| `assignments.json` | `../assignments.ts` → `AssignmentView` | PT3 project-work and Calisthenics 2 practical-submission briefs |
| `practical.json` | `../practical.ts` → `PracticalResources` / `PT3ResourcesView` | Workout plans, muscle groups, gym exercises, PT2 plans, PT3 resources |

These files are not a fallback for course/module/lesson API failures. Browser progress and assignment submission storage also retain their existing local behavior; no student-progress or submission backend is connected by this migration. Legacy mock flags do not control the live curriculum adapters.

Future replacement needs verified endpoint/security, success/error, grading, upload, and persistence contracts before deleting the corresponding datasets. See [API contracts](../../../../brain/api_contracts.md), [API handoff](../../../../brain/api_handoff.md), and ADR-061.

[Backend OpenAPI](https://api-production-c166.up.railway.app/openapi.json)
