// App Initialization & State Management
document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const homeScreen = document.getElementById("home-screen");
    const quizScreen = document.getElementById("quiz-screen");
    const resultScreen = document.getElementById("result-screen");
    const reviewScreen = document.getElementById("review-screen");

    const btnStart = document.getElementById("btn-start");
    const btnContinue = document.getElementById("btn-continue");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const btnSubmitEarly = document.getElementById("btn-submit-early");
    const btnReview = document.getElementById("btn-review");
    const btnRestart = document.getElementById("btn-restart");
    const btnBackResult = document.getElementById("btn-back-result");

    const questionNumberEl = document.getElementById("question-number");
    const progressBarEl = document.getElementById("progress-bar");
    const questionTextEl = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const paletteGrid = document.getElementById("question-palette");

    const STORAGE_KEY = "computing_quiz_state_v1";

    let state = {
        currentIndex: 0,
        answers: {}, // map of qIndex => selectedOptionIndex or String
        visited: {}  // map of qIndex => boolean
    };

    // Load State from LocalStorage
    function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                state = JSON.parse(saved);
                btnContinue.classList.remove("hidden");
            } catch (e) {
                console.error("Failed to parse saved state", e);
            }
        }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function clearState() {
        localStorage.removeItem(STORAGE_KEY);
        state = { currentIndex: 0, answers: {}, visited: {} };
    }

    function showScreen(screen) {
        [homeScreen, quizScreen, resultScreen, reviewScreen].forEach(s => s.classList.remove("active"));
        screen.classList.add("active");
    }

    function initHome() {
        loadState();
        showScreen(homeScreen);
    }

    function startQuiz(resume = false) {
        if (!resume) {
            clearState();
        }
        showScreen(quizScreen);
        renderQuestion();
        renderPalette();
    }

    function renderQuestion() {
        const q = QUIZ_QUESTIONS[state.currentIndex];
        state.visited[state.currentIndex] = true;
        saveState();

        questionNumberEl.textContent = `Question ${state.currentIndex + 1} / ${QUIZ_QUESTIONS.length}`;
        progressBarEl.style.width = `${((state.currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`;
        questionTextEl.textContent = `${q.id}. ${q.question}`;

        optionsContainer.innerHTML = "";

        q.options.forEach((opt, idx) => {
            const optBtn = document.createElement("button");
            optBtn.className = "option-btn";
            if (state.answers[state.currentIndex] === idx) {
                optBtn.classList.add("selected");
            }
            optBtn.textContent = opt;
            optBtn.onclick = () => selectOption(idx);
            optionsContainer.appendChild(optBtn);
        });

        btnPrev.disabled = state.currentIndex === 0;
        if (state.currentIndex === QUIZ_QUESTIONS.length - 1) {
            btnNext.textContent = "Submit";
        } else {
            btnNext.textContent = "Next";
        }

        updatePaletteCurrent();
    }

    function selectOption(index) {
        state.answers[state.currentIndex] = index;
        saveState();
        renderQuestion();
        renderPalette();
    }

    function renderPalette() {
        paletteGrid.innerHTML = "";
        QUIZ_QUESTIONS.forEach((q, idx) => {
            const btn = document.createElement("button");
            btn.className = "palette-btn";
            btn.textContent = idx + 1;

            if (idx === state.currentIndex) {
                btn.classList.add("current");
            } else if (state.answers[idx] !== undefined) {
                btn.classList.add("answered");
            }

            btn.onclick = () => {
                state.currentIndex = idx;
                renderQuestion();
            };
            paletteGrid.appendChild(btn);
        });
    }

    function updatePaletteCurrent() {
        const btns = paletteGrid.children;
        for (let i = 0; i < btns.length; i++) {
            btns[i].classList.remove("current");
            if (i === state.currentIndex) {
                btns[i].classList.add("current");
            }
        }
    }

    function submitQuiz() {
        let correct = 0;
        let wrong = 0;
        let unattempted = 0;

        QUIZ_QUESTIONS.forEach((q, idx) => {
            const userAns = state.answers[idx];
            if (userAns === undefined) {
                unattempted++;
            } else {
                const selectedText = q.options[userAns];
                if (q.type === "mcq") {
                    // Extract letter option prefix like "a)"
                    const optionLetter = selectedText.trim().charAt(0).toUpperCase();
                    if (optionLetter === q.answer.toUpperCase()) {
                        correct++;
                    } else {
                        wrong++;
                    }
                } else if (q.type === "tf") {
                    const ansLetter = selectedText.trim().charAt(0).toUpperCase();
                    if (ansLetter === q.answer.toUpperCase()) {
                        correct++;
                    } else {
                        wrong++;
                    }
                }
            }
        });

        const total = QUIZ_QUESTIONS.length;
        const percentage = Math.round((correct / total) * 100);

        document.getElementById("result-percentage").textContent = `${percentage}%`;
        document.getElementById("result-score").textContent = `Score: ${correct} / ${total}`;
        document.getElementById("res-correct").textContent = correct;
        document.getElementById("res-wrong").textContent = wrong;
        document.getElementById("res-unattempted").textContent = unattempted;

        showScreen(resultScreen);
    }

    function renderReview() {
        const reviewList = document.getElementById("review-list");
        reviewList.innerHTML = "";

        QUIZ_QUESTIONS.forEach((q, idx) => {
            const item = document.createElement("div");
            item.className = "card review-item";

            const qTitle = document.createElement("div");
            qTitle.className = "review-question";
            qTitle.textContent = `${q.id}. ${q.question}`;
            item.appendChild(qTitle);

            const userAnsIdx = state.answers[idx];

            q.options.forEach((opt, optIdx) => {
                const optDiv = document.createElement("div");
                optDiv.className = "review-option";
                optDiv.textContent = opt;

                const optLetter = opt.trim().charAt(0).toUpperCase();
                const isCorrect = optLetter === q.answer.toUpperCase();
                const isUserSelected = userAnsIdx === optIdx;

                if (isCorrect) {
                    optDiv.classList.add("correct-ans");
                    optDiv.textContent += " ✓ (Official Answer)";
                } else if (isUserSelected && !isCorrect) {
                    optDiv.classList.add("wrong-ans");
                    optDiv.textContent += " ✗ (Your Answer)";
                }

                item.appendChild(optDiv);
            });

            reviewList.appendChild(item);
        });

        showScreen(reviewScreen);
    }

    // Event Listeners
    btnStart.onclick = () => startQuiz(false);
    btnContinue.onclick = () => startQuiz(true);
    btnPrev.onclick = () => {
        if (state.currentIndex > 0) {
            state.currentIndex--;
            renderQuestion();
        }
    };
    btnNext.onclick = () => {
        if (state.currentIndex < QUIZ_QUESTIONS.length - 1) {
            state.currentIndex++;
            renderQuestion();
        } else {
            submitQuiz();
        }
    };
    btnSubmitEarly.onclick = () => {
        if (confirm("Are you sure you want to submit your quiz?")) {
            submitQuiz();
        }
    };
    btnReview.onclick = renderReview;
    btnRestart.onclick = () => startQuiz(false);
    btnBackResult.onclick = () => showScreen(resultScreen);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.error('Service Worker registration failed:', err);
            });
        });
    }

    initHome();
});

