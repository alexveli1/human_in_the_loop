from helpers.tool import Tool, Response
import asyncio

class HitlAsk(Tool):
    name = "hitl_ask"
    description = "Pauses the agent and presents a series of questions to the user via a tabbed popup. Returns all answers when complete."

    async def execute(self, questions: list[dict], **kwargs) -> Response:
        # Assign IDs to questions if missing to ensure frontend can reference them
        for i, q in enumerate(questions):
            if "id" not in q:
                q["id"] = f"q_{i}"
        self.agent.context.set_data("hitl_pending", questions)
        self.agent.context.set_data("hitl_answers", {})
        self.agent.context.set_data("hitl_complete", False)
        self.agent.context.paused = True

        while self.agent.context.paused:
            await asyncio.sleep(0.5)

        answers = self.agent.context.get_data("hitl_answers")
        self.agent.context.set_data("hitl_pending", None)
        self.agent.context.set_data("hitl_answers", None)
        self.agent.context.set_data("hitl_complete", None)
        return Response(message=f"User answers: {answers}", break_loop=False)
