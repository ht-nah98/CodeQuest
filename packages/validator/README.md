# @codequest/validator (headless)

Luật kiểm chứng **cấp màn** (`content-model.md` §5: 1, 2 mẫu ID, 5–6, 9–16) và vét cạn `par` / `parEdits`. Dùng chung cho `tools/content-check`, `tools/par` (`npm run par`) và level editor trong trình duyệt (P2-07). Quyết định: ADR-0015.

**Đọc trước:** `docs/architecture/content-model.md` §5, §8, `runtime-engine.md`.

```
src/
├─ validateLevel.ts   validateLevel(json, { isDraft, getKind }) → { level, issues, solutionBlocks }
├─ levelRules.ts      luật 5–6, 12–16
├─ issue.ts           RuleIssue, formatSchemaIssues
├─ workspace.ts       blockTypesOf, countShadows, blockSignatures
├─ words.ts           countWords (luật 5)
├─ search/
│  ├─ program.ts      Program/Statement ↔ workspace JSON, formatProgram
│  ├─ sim.ts          FastSim: phát lại mô phỏng thật, gộp trạng thái, nhớ bước
│  ├─ shortest.ts     findShortestPrograms (số khối ít nhất, đếm lời giải)
│  ├─ fixes.ts        findFixes (số lần sửa ít nhất cho bughunt)
│  └─ budget.ts       SearchOptions, ngân sách công việc, shouldStop
└─ index.ts           export công khai duy nhất
```
**Cấm:** DOM, `fs`/`node:*`, `Date`, `Math.random`, import `apps/web`, `tools`, `rewards`. Vét cạn phải tất định: giới hạn bằng `maxWork` (`WORKER_MAX_WORK` cho Web Worker của editor); muốn giới hạn thời gian thì truyền `shouldStop` từ bên ngoài (CLI, Web Worker). Giả định về kiểu game: `docs/architecture/game-kind-sdk.md` §4.
