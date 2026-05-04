import asyncio
from helpers.api import ApiHandler, Request
from agent import AgentContext

class HitlSubmit(ApiHandler):
    @classmethod
    def requires_auth(cls) -> bool:
        return False

    async def process(self, input: dict, request: Request) -> dict:
        ctx_id = str(input.get("context_id", ""))
        if not ctx_id:
            return {"ok": False, "error": "Missing context_id"}

        ctx = AgentContext.get(ctx_id)
        if not ctx:
            return {"ok": False, "error": "Context not found"}

        q_id = input.get("question_id")
        answer = input.get("answer")
        finalize = input.get("finalize", False)

        if q_id and answer is not None:
            answers = ctx.get_data("hitl_answers") or {}
            answers[q_id] = answer
            ctx.set_data("hitl_answers", answers)
            # # # print(f"[HITL] Saved answer for {q_id}: {answer}")

        if finalize:
            # # # print("[HITL] Finalize requested. Waiting for all answers to persist...")
            pending = ctx.get_data("hitl_pending") or []
            expected_count = len(pending)
            
            # Wait up to 3 seconds for all individual answer submissions to land
            for _ in range(30):
                await asyncio.sleep(0.1)
                current_answers = ctx.get_data("hitl_answers") or {}
                if len(current_answers) >= expected_count:
                    # # # print(f"[HITL] All {len(current_answers)}/{expected_count} answers received and persisted.")
                    break
            else:
                pass
            ctx.set_data("hitl_complete", True)
            ctx.set_data("hitl_pending", [])
            ctx.paused = False
            # # # print("[HITL] Marked complete and unpaused context.")

        return {"ok": True}
