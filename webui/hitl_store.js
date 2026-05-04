import { createStore } from "/js/AlpineStore.js";

export const store = createStore("hitlStore", {
    state: 'idle',
    questions: [],
    answers: {},
    currentTab: 0,
    loading: true,
    closing: false,
    interval: null,

    init() {
        let retries = 0;
        const maxRetries = 20;
        const checkGlobals = () => {
            if (typeof window.openModal !== 'undefined' && typeof window.getContext !== 'undefined') {
                this.startIdlePolling();
            } else if (retries < maxRetries) {
                retries++;
                setTimeout(checkGlobals, 500);
            }
        };
        checkGlobals();
    },

    startIdlePolling() {
        this.stopPolling();
        this.interval = setInterval(() => this.checkForPending(), 2000);
    },

    stopPolling() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
    },

    async checkForPending() {
        if (this.state !== 'idle') return;
        const ctxId = window.getContext?.() || null;
        if (!ctxId) return;

        try {
            const res = await fetch(`/api/plugins/human_in_the_loop/hitl_status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context_id: ctxId })
            });
            const data = await res.json();
            if (data.ok && data.pending && Array.isArray(data.pending) && data.pending.length > 0) {
                this.questions = data.pending.map((q, i) => ({ ...q, id: q?.id || `q_${i}` }));
                this.answers = data.answers || {};
                this.loading = false;
                this.state = 'active';
                this.stopPolling();
                window.openModal(`/plugins/human_in_the_loop/webui/hitl_modal.html?v=${Date.now()}`);
            }
        } catch (err) {
            console.error("[HITL] Poll error:", err);
        }
    },

    submitAnswer(qId, answer) {
        const ctxId = window.getContext?.() || null;
        if (!ctxId) return;
        if (answer === null || answer === undefined || answer === '') return;
        
        this.answers = { ...this.answers, [qId]: answer };

        fetch(`/api/plugins/human_in_the_loop/hitl_submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context_id: ctxId, question_id: qId, answer: answer })
        }).catch(console.error);
        
        if (this.currentTab < this.questions.length) {
            this.currentTab = Math.min(this.currentTab + 1, this.questions.length);
        }
    },

    async finalize() {
        const ctxId = window.getContext?.() || null;
        if (!ctxId) return;
        
        const q = this.questions[this.currentTab];
        if (q && this.answers[q.id]) {
            this.submitAnswer(q.id, this.answers[q.id]);
        }

        this.closing = true;
        try {
            await fetch(`/api/plugins/human_in_the_loop/hitl_submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context_id: ctxId, finalize: true })
            });
            window.closeModal?.();
            this.cleanup();
            this.state = 'idle';
            this.startIdlePolling();
        } catch (err) {
            console.error("[HITL] Finalize error:", err);
            this.closing = false;
            this.state = 'active';
        }
    },

    cleanup() {
        this.stopPolling();
        this.questions = [];
        this.answers = {};
        this.currentTab = 0;
        this.loading = true;
        this.closing = false;
    },

    isAnswered(qId, opt) {
        return this.answers[qId] == opt;
    }
});
