// ============ Обучающий тур при первом открытии (spotlight / coach marks) ============
// Затемняет экран, «прожектор» плавно перемещается между элементами интерфейса,
// рядом — карточка с объяснением. Показывается один раз (localStorage + CloudStorage),
// повторный запуск — из Профиля («Обучение»).

const Tour = {
    // key → тексты tour_<key>_t / tour_<key>_d в i18n; target — подсвечиваемый
    // элемент; view — вкладка, на которой живёт шаг (по умолчанию «Сигнал»).
    steps: [
        { key: "welcome", target: null, view: "signal" },
        { key: "market", target: "#market-seg", view: "signal" },
        { key: "pair", target: "#view-signal .select-card", view: "signal" },
        { key: "tf", target: "#tf-chips", view: "signal" },
        { key: "cta", target: "#get-signal-btn", view: "signal" },
        { key: "tabs", target: ".tabbar", view: "signal" },
        { key: "markettab", target: "#view-market .mrow", view: "market" },
        { key: "done", target: null, view: "signal" },
    ],
    i: 0,
    active: false,
    _built: false,

    el(id) {
        return document.getElementById(id);
    },

    // --- Первый запуск ---
    maybeStart() {
        if (store.get("hog_tour_done", false)) return;
        // CloudStorage переживает чистку кэша: если юзер уже проходил тур — не показываем
        cloud.get("hog_tour_done", (remote) => {
            if (remote) {
                store.set("hog_tour_done", true);
                return;
            }
            setTimeout(() => this.start(), 600);
        });
    },

    start() {
        if (this.active) return;
        this.active = true;
        this.i = 0;
        switchView("signal"); // все шаги живут на экране «Сигнал»
        this.build();
        this.el("tour-overlay").classList.add("open");
        haptic("light");
        this.showStep();
        this._onResize = () => this.showStep();
        window.addEventListener("resize", this._onResize);
    },

    finish() {
        if (!this.active) return;
        this.active = false;
        store.set("hog_tour_done", true);
        cloud.set("hog_tour_done", true);
        this.el("tour-overlay").classList.remove("open");
        window.removeEventListener("resize", this._onResize);
        hapticNotify("success");
    },

    next() {
        if (this.i >= this.steps.length - 1) {
            this.finish();
            return;
        }
        this.i++;
        haptic("light");
        this.showStep();
    },

    // --- DOM тура (создаётся один раз) ---
    build() {
        if (this._built) return;
        this._built = true;

        const overlay = document.createElement("div");
        overlay.className = "tour-overlay";
        overlay.id = "tour-overlay";
        overlay.innerHTML =
            '<div class="tour-hole" id="tour-hole"></div>' +
            '<div class="tour-card" id="tour-card">' +
            '<div class="tour-title" id="tour-title"></div>' +
            '<div class="tour-text" id="tour-text"></div>' +
            '<div class="tour-dots" id="tour-dots"></div>' +
            '<div class="tour-actions">' +
            '<button class="tour-skip" id="tour-skip"></button>' +
            '<button class="tour-next" id="tour-next"></button>' +
            "</div></div>";
        document.body.appendChild(overlay);

        this.el("tour-next").addEventListener("click", () => this.next());
        this.el("tour-skip").addEventListener("click", () => this.finish());
        // Тап по затемнению — тоже «Далее» (привычно на мобильных)
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay || e.target === this.el("tour-hole")) this.next();
        });
        // Блокируем прокрутку страницы под оверлеем
        overlay.addEventListener(
            "touchmove",
            (e) => e.preventDefault(),
            { passive: false },
        );
    },

    // --- Отрисовка текущего шага ---
    showStep() {
        if (!this.active) return;
        const step = this.steps[this.i];
        const last = this.i === this.steps.length - 1;

        // Шаг может жить на другой вкладке (напр. демонстрация выбора пары в «Рынке»)
        const viewChanged = step.view && App.state.view !== step.view;
        if (step.view) switchView(step.view);

        this.el("tour-title").textContent = t("tour_" + step.key + "_t");
        this.el("tour-text").textContent = t("tour_" + step.key + "_d");
        this.el("tour-next").textContent = last ? t("tour_start") : t("tour_next");
        const skip = this.el("tour-skip");
        skip.textContent = t("tour_skip");
        skip.style.visibility = last ? "hidden" : "visible";

        // Точки прогресса
        const dots = this.el("tour-dots");
        dots.innerHTML = "";
        this.steps.forEach((_, n) => {
            const d = document.createElement("span");
            d.className = "tour-dot" + (n === this.i ? " on" : "");
            dots.appendChild(d);
        });

        // После смены вкладки ждём завершения её анимации, иначе замер съедет
        const delay = viewChanged ? 380 : 60;
        setTimeout(() => {
            if (!this.active) return;
            const target = step.target && document.querySelector(step.target);
            if (target) target.scrollIntoView({ block: "nearest" });
            this.place(target);
        }, delay);

        // Перезапуск анимации появления карточки
        const card = this.el("tour-card");
        card.style.animation = "none";
        void card.offsetWidth;
        card.style.animation = "";
    },

    place(target) {
        const hole = this.el("tour-hole");
        const card = this.el("tour-card");
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cardW = Math.min(340, vw - 32);
        card.style.width = cardW + "px";
        const cardH = card.offsetHeight;

        if (!target) {
            // Шаг без цели: прожектор схлопнут, карточка по центру
            hole.classList.add("no-target");
            hole.style.cssText = `top:${vh / 2}px;left:${vw / 2}px;width:0;height:0;border-radius:50%`;
            card.style.top = Math.max(16, (vh - cardH) / 2) + "px";
            card.style.left = (vw - cardW) / 2 + "px";
            return;
        }

        hole.classList.remove("no-target");
        const pad = 8;
        const r = target.getBoundingClientRect();
        const hx = Math.max(6, r.left - pad);
        const hy = Math.max(6, r.top - pad);
        const hw = Math.min(vw - 12, r.width + pad * 2);
        const hh = r.height + pad * 2;
        hole.style.cssText = `top:${hy}px;left:${hx}px;width:${hw}px;height:${hh}px;border-radius:16px`;

        // Карточка под целью, если не влезает — над ней
        let top = hy + hh + 14;
        if (top + cardH > vh - 16) top = hy - cardH - 14;
        if (top < 16) top = 16;
        const cx = r.left + r.width / 2;
        const left = Math.min(Math.max(16, cx - cardW / 2), vw - cardW - 16);
        card.style.top = top + "px";
        card.style.left = left + "px";
    },
};
