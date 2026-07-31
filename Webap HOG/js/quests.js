// ============ Серии и задание дня ============
// Механики удержания: серия дней подряд (её жалко терять) и дневная цель по
// сигналам с видимым прогрессом. Незакрытый прогресс-бар тянет юзера взять
// ещё сигнал — а каждый сигнал в связке с кнопкой «Открыть сделку» это оборот.
//
// Состояние дублируется в Telegram CloudStorage: серия переживает чистку кэша,
// иначе достижение обнуляется на ровном месте и механика работает против нас.

const Quests = {
    streak: { n: 0, best: 0, last: null },
    quest: { day: null, n: 0 },

    today() {
        return new Date().toISOString().slice(0, 10);
    },

    yesterday() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().slice(0, 10);
    },

    // ---------- Серия визитов ----------

    touchStreak() {
        const today = this.today();
        if (this.streak.last === today) return;
        if (this.streak.last === this.yesterday()) this.streak.n += 1;
        else this.streak.n = 1;
        this.streak.last = today;
        this.streak.best = Math.max(this.streak.best || 0, this.streak.n);
        this.persistStreak();
    },

    persistStreak() {
        store.set("hog_streak", this.streak);
        cloud.set("hog_streak", this.streak);
    },

    // ---------- Задание дня ----------

    resetIfNewDay() {
        const today = this.today();
        if (this.quest.day !== today) {
            this.quest = { day: today, n: 0 };
            store.set("hog_quest", this.quest);
        }
    },

    bump() {
        this.resetIfNewDay();
        const wasDone = this.quest.n >= CONFIG.DAILY_GOAL;
        this.quest.n += 1;
        store.set("hog_quest", this.quest);
        this.render();
        if (!wasDone && this.quest.n >= CONFIG.DAILY_GOAL) {
            hapticNotify("success");
        }
    },

    // ---------- Уровень ----------

    level() {
        return 1 + Math.floor(store.get("hog_count", 0) / 10);
    },

    // ---------- Отрисовка ----------

    render() {
        this.resetIfNewDay();

        const goal = CONFIG.DAILY_GOAL;
        const done = Math.min(this.quest.n, goal);
        const nowEl = document.getElementById("quest-now");
        const goalEl = document.getElementById("quest-goal");
        const fill = document.getElementById("quest-fill");
        const note = document.getElementById("quest-note");
        const card = document.getElementById("quest-card");

        if (nowEl) nowEl.textContent = done;
        if (goalEl) goalEl.textContent = goal;
        if (fill) fill.style.width = (done / goal) * 100 + "%";
        if (card) card.classList.toggle("done", this.quest.n >= goal);
        if (note) {
            note.textContent =
                this.quest.n >= goal ? t("quest_done") : t("quest_desc") + " " + goal;
        }

        const badge = document.getElementById("streak-badge");
        const count = document.getElementById("streak-count");
        if (badge && count) {
            count.textContent = this.streak.n;
            badge.hidden = this.streak.n < 2; // серия из одного дня — ещё не достижение
        }
    },

    init() {
        this.streak = store.get("hog_streak", { n: 0, best: 0, last: null });
        this.quest = store.get("hog_quest", { day: null, n: 0 });

        // Облако может знать более длинную серию (кэш чистили) — берём максимум
        cloud.get("hog_streak", (remote) => {
            if (remote && typeof remote.n === "number" && remote.n > this.streak.n) {
                this.streak = remote;
                this.touchStreak();
                this.render();
                Profile.render();
            }
        });

        this.touchStreak();
        this.resetIfNewDay();
        this.render();
    },
};
