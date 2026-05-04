import { createStore } from "/js/AlpineStore.js";

export const store = createStore("hitlStore", {
    state: 'idle', // idle, active, submitting, closing
    questions: [],
    answers: {},
    currentTab: 0,
    interval: null,

    init() {
        // console.log("[HITL] Store initialized. Waiting for globals...");
        const checkGlobals = () => {
            if (typeof window.openModal === 'undefined' || typeof window.getContext === 'undefined') {
                setTimeout(checkGlobals, 500);
                return;
            }
            // console.log("[HITL] Globals ready. Starting polling...");
            this.interval = setInterval(() => this.pollStatus(), 1000);
        };
        checkGlobals();
    },

    pollStatus() {
        const ctxId = window.getContext?.() || null;
        if (!ctxId) return;

        fetch(`/api/plugins/human_in_the_loop/hitl_status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context_id: ctxId })
        })
        .then(res => res.json())
        .then(data => {
            const hasPending = data.ok && data.pending;
            const isDone = data.complete === true || (Array.isArray(data.pending) && data.pending.length === 0);

            if (this.state === 'idle' && hasPending) {
                // console.log("[HITL] Pending questions detected. Opening modal.");
                // console.log("[HITL] Raw pending data:", data.pending);
                this.questions = (Array.isArray(data.pending) ? data.pending : []).map((q, i) => {
                    const id = q?.id || `q_${i}`;
                    // console.log(`[HITL] Assigned ID ${id} to question ${i}`);
                    return { ...q, id };
                });
                this.answers = data.answers || {};
                this.currentTab = 0;
                this.state = 'active';
                window.openModal(`/plugins/human_in_the_loop/webui/hitl_modal.html?v=${Date.now()}`);
            } else if ((this.state === 'active' || this.state === 'submitting') && isDone) {
                // console.log("[HITL] Task complete or no longer pending. Closing modal.");
                this.state = 'closing';
                window.closeModal?.();
                this.cleanup();
            } else if (this.state === 'closing' && !hasPending && !data.complete) {
                // console.log("[HITL] Backend cleared. Resetting to idle.");
                this.state = 'idle';
            }
        })
        .catch(err => console.error("[HITL] Poll error:", err));
    },

    submitAnswer(qId, answer) {
        const ctxId = window.getContext?.() || null;
        if (!ctxId) return;
        if (answer === null || answer === undefined || answer === '') return;
        
        // console.log(`[HITL] Submitting answer for ${qId}:`, answer);
        this.answers = { ...this.answers, [qId]: answer };

        fetch(`/api/plugins/human_in_the_loop/hitl_submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context_id: ctxId, question_id: qId, answer: answer })
        }).then(res => res.json()).catch(console.error);
        
        if (this.currentTab < this.questions.length) {
            this.currentTab = Math.min(this.currentTab + 1, this.questions.length);
        }
    },

    finalize() {
        const ctxId = window.getContext?.() || null;
        if (!ctxId) return;
        
        const q = this.questions[this.currentTab];
        if (q && this.answers[q.id]) {
             this.submitAnswer(q.id, this.answers[q.id]);
        }

        this.state = 'submitting';
        // console.log("[HITL] Finalizing submission.");
        fetch(`/api/plugins/human_in_the_loop/hitl_submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context_id: ctxId, finalize: true })
        }).then(res => res.json()).catch(console.error);
    },

    cleanup() {
        clearInterval(this.interval);
        this.interval = null;
        this.questions = [];
        this.answers = {};
        this.currentTab = 0;
        this.state = 'idle';
    },

    isAnswered(qId, opt) {
        return this.answers[qId] == opt;
    }
});
