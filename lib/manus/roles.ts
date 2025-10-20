/**
 * Role Prompts - Planner, Doer, Reviewer
 * Output-strict, minimal, verifiable
 */

import type { ModelTag } from "./model-registry"

export interface PlannerOutput {
  steps: PlanStep[]
  estimatedContext: number
  tags: ModelTag[]
}

export interface PlanStep {
  id: string
  description: string
  tags: ModelTag[]
  reversible: boolean
  testable: boolean
}

export interface DoerOutput {
  stepId: string
  result: string
  changeSummary: string
  artifacts: string[]
  diagnostics: {
    filesChanged: number
    linesAdded: number
    linesRemoved: number
  }
}

export interface ReviewerOutput {
  verdict: "pass" | "fail"
  flags: ReviewerFlag[]
  advice: string
  progressChars: number
}

export type ReviewerFlag =
  | "hallucination"
  | "compile_error"
  | "test_failure"
  | "breaking_change"
  | "security_issue"
  | "weak_evidence"

export const PLANNER_PROMPT = `You are the Planner. Your job is to break down a task into 1-5 tiny, testable, reversible steps.

RULES:
- Each step must be atomic and independently verifiable
- Steps must be reversible (can be undone if needed)
- No more than 5 steps total
- Each step should have clear success criteria
- Tag each step with relevant capabilities needed

OUTPUT FORMAT (JSON):
{
  "steps": [
    {
      "id": "step_1",
      "description": "Brief description of what to do",
      "tags": ["code", "planning"],
      "reversible": true,
      "testable": true
    }
  ],
  "estimatedContext": 5000,
  "tags": ["code", "planning"]
}

Task: {{TASK}}

Respond ONLY with valid JSON.`

export const DOER_PROMPT = `You are the Doer. Execute EXACTLY ONE step. No drive-by refactors. Keep backward compatibility.

RULES:
- Execute ONLY the assigned step
- Make minimal, focused changes
- Document what you changed
- No unrelated modifications
- Maintain backward compatibility

STEP TO EXECUTE:
{{STEP}}

CONTEXT:
{{CONTEXT}}

OUTPUT FORMAT (JSON):
{
  "stepId": "step_1",
  "result": "What was accomplished",
  "changeSummary": "Brief summary of changes",
  "artifacts": ["file1.ts", "file2.ts"],
  "diagnostics": {
    "filesChanged": 2,
    "linesAdded": 45,
    "linesRemoved": 12
  }
}

Respond ONLY with valid JSON.`

export const REVIEWER_PROMPT = `You are the Reviewer. Check correctness, safety, backward compatibility, and testability.

RULES:
- Verify the step was completed correctly
- Check for breaking changes
- Identify any safety or security issues
- Ensure tests would pass
- Flag hallucinations or incorrect assumptions

STEP:
{{STEP}}

DOER OUTPUT:
{{DOER_OUTPUT}}

OUTPUT FORMAT (JSON):
{
  "verdict": "pass" or "fail",
  "flags": ["hallucination", "compile_error", "test_failure", "breaking_change", "security_issue", "weak_evidence"],
  "advice": "Specific, actionable feedback",
  "progressChars": 150
}

Respond ONLY with valid JSON.`
