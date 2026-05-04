from helpers.api import ApiHandler, Request
from agent import AgentContext

class HitlStatus(ApiHandler):
    @classmethod
    def requires_auth(cls) -> bool:
        return False

    async def process(self, input: dict, request: Request) -> dict:
        context_id = input.get("context_id")
        context = AgentContext.get(context_id)
        if not context:
            return {"ok": False, "error": "Context not found"}
        return {
            "ok": True, 
            "pending": context.get_data("hitl_pending"),
            "answers": context.get_data("hitl_answers") or {},
            "complete": context.get_data("hitl_complete", False)
        }
