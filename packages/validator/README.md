# @codequest/validator (headless)

Luật kiểm chứng **cấp màn** (`content-model.md` §5: 1, 2 mẫu ID, 5–6, 9–16, 19–20) và vét cạn `par` / `parEdits`. Màn nhiều bản đồ (`variants`, ADR-0016): luật 1 và 9 xét mọi bản đồ, vét cạn chỉ nhận chương trình thắng mọi bản đồ (`FastSim` dùng bộ trạng thái, mỗi bản đồ một `MapSim`; trần `MAX_TUPLE_STATES` bộ, vượt thì dừng bằng `SearchAborted` như hết ngân sách). Dùng chung cho `tools/content-check`, `tools/par` (`npm run par`) và level editor trong trình duyệt (P2-07). Khối điều kiện (`cq_if`, `cq_if_else`, `cq_repeat_until` + cảm biến), `maxInstances`, `maxLoopDepth` (P2-11b): `FastSim` hỏi cảm biến bằng API thật trên bản sao trạng thái (nhớ theo trạng thái, cảm biến), mỗi bản đồ đi nhánh riêng; `lặp đến khi` quay lại trạng thái cũ = không dừng = thua. Quyết định: ADR-0015, ADR-0018.

**Đọc trước:** `docs/architecture/content-model.md` §5, §8, `runtime-engine.md`.

```
src/
├─ validateLevel.ts   validateLevel(json, { isDraft, getKind }) → { level, issues, solutionBlocks }
├─ levelRules.ts      luật 5–6, 12–16, 19, 20 (maxLoopDepth, maxInstances)
├─ issue.ts           RuleIssue, formatSchemaIssues
├─ workspace.ts       blockTypesOf, countShadows, blockSignatures
├─ words.ts           countWords (luật 5)
├─ search/
│  ├─ program.ts      Program/Statement/Condition ↔ workspace JSON, formatProgram, đếm khối/tầng lặp
│  ├─ limits.ts       InstanceLimits: maxInstances như vector số khối đã dùng
│  ├─ sim.ts          FastSim: phát lại mô phỏng thật, gộp trạng thái, nhớ bước
│  ├─ shortest.ts     findShortestPrograms (số khối ít nhất, đếm lời giải)
│  ├─ fixes.ts        findFixes (số lần sửa ít nhất cho bughunt)
│  └─ budget.ts       SearchOptions, ngân sách công việc, shouldStop
└─ index.ts           export công khai duy nhất
```
**Cấm:** DOM, `fs`/`node:*`, `Date`, `Math.random`, import `apps/web`, `tools`, `rewards`. Vét cạn phải tất định: giới hạn bằng `maxWork` (`WORKER_MAX_WORK` cho Web Worker của editor); muốn giới hạn thời gian thì truyền `shouldStop` từ bên ngoài (CLI, Web Worker). Giả định về kiểu game: `docs/architecture/game-kind-sdk.md` §4.
