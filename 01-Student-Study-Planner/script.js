// ===============================
// TASK DATA
// ===============================

let tasks = JSON.parse(
    localStorage.getItem("studyTasks")
) || [];


// ===============================
// REWARD DATA
// ===============================

let rewards = JSON.parse(
    localStorage.getItem("studyRewards")
) || {
    xp: 0,
    coins: 0
};


// Add the rewarded property to old tasks
// that were created before the reward system.

tasks = tasks.map(task => ({
    ...task,
    rewarded: task.rewarded || false
}));


let currentFilter = "all";


// ===============================
// DOM ELEMENTS
// ===============================

const taskForm =
    document.getElementById("taskForm");

const taskInput =
    document.getElementById("taskInput");

const subjectInput =
    document.getElementById("subjectInput");

const dateInput =
    document.getElementById("dateInput");

const taskList =
    document.getElementById("taskList");

const emptyState =
    document.getElementById("emptyState");

const totalTasks =
    document.getElementById("totalTasks");

const completedTasks =
    document.getElementById("completedTasks");

const activeTasks =
    document.getElementById("activeTasks");

const progressPercentage =
    document.getElementById("progressPercentage");

const progressText =
    document.getElementById("progressText");

const progressFill =
    document.getElementById("progressFill");

const todayDate =
    document.getElementById("todayDate");

const xpValue =
    document.getElementById("xpValue");

const coinValue =
    document.getElementById("coinValue");

const levelBadge =
    document.getElementById("levelBadge");

const levelText =
    document.getElementById("levelText");

const levelXpText =
    document.getElementById("levelXpText");

const rewardProgressFill =
    document.getElementById("rewardProgressFill");

const notification =
    document.getElementById("notification");

const themeToggle =
    document.getElementById("themeToggle");


// ===============================
// TODAY'S DATE
// ===============================

const today = new Date();

todayDate.textContent =
    today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });


// ===============================
// SAVE TASKS
// ===============================

function saveTasks() {

    localStorage.setItem(
        "studyTasks",
        JSON.stringify(tasks)
    );
}


// ===============================
// SAVE REWARDS
// ===============================

function saveRewards() {

    localStorage.setItem(
        "studyRewards",
        JSON.stringify(rewards)
    );
}


// ===============================
// ADD TASK
// ===============================

taskForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const task = {

            id: Date.now(),

            title:
                taskInput.value.trim(),

            subject:
                subjectInput.value.trim(),

            date:
                dateInput.value,

            completed: false,

            rewarded: false
        };


        tasks.push(task);

        saveTasks();

        taskForm.reset();

        renderTasks();
    }
);


// ===============================
// RENDER TASKS
// ===============================

function renderTasks() {

    taskList.innerHTML = "";

    let filteredTasks = tasks;


    if (currentFilter === "active") {

        filteredTasks =
            tasks.filter(
                task => !task.completed
            );
    }


    if (currentFilter === "completed") {

        filteredTasks =
            tasks.filter(
                task => task.completed
            );
    }


    emptyState.style.display =
        filteredTasks.length === 0
            ? "block"
            : "none";


    filteredTasks.forEach(task => {

        const taskElement =
            document.createElement("div");


        taskElement.className =
            `task ${
                task.completed
                    ? "completed"
                    : ""
            }`;


        taskElement.innerHTML = `

            <div class="task-left">

                <input
                    type="checkbox"
                    ${
                        task.completed
                            ? "checked"
                            : ""
                    }
                    onchange="toggleTask(${task.id})"
                >

                <div class="task-info">

                    <h3>
                        ${task.title}
                    </h3>

                    <p>
                        ${task.subject}
                        • Due
                        ${formatDate(task.date)}
                    </p>

                </div>

            </div>


            <button
                class="delete-btn"
                onclick="deleteTask(${task.id})"
                title="Delete task"
            >
                🗑️
            </button>
        `;


        taskList.appendChild(
            taskElement
        );
    });


    updateStats();
}


// ===============================
// TOGGLE TASK
// ===============================

function toggleTask(id) {

    const task =
        tasks.find(
            task => task.id === id
        );


    if (!task) {
        return;
    }


    // Completing the task

    if (!task.completed) {

        task.completed = true;


        // Give reward only once

        if (!task.rewarded) {

            rewards.xp += 10;

            rewards.coins += 1;

            task.rewarded = true;

            saveRewards();

            showNotification(
                "🎉 Task completed! +10 XP 🪙"
            );
        }

    }

    // Uncompleting the task

    else {

        task.completed = false;

        // IMPORTANT:
        // We do NOT reset rewarded.
        // Therefore completing it again
        // will not give another reward.
    }


    saveTasks();

    renderTasks();
}


// ===============================
// DELETE TASK
// ===============================

function deleteTask(id) {

    tasks =
        tasks.filter(
            task => task.id !== id
        );


    saveTasks();

    renderTasks();
}


// ===============================
// FORMAT DATE
// ===============================

function formatDate(date) {

    if (!date) {
        return "";
    }


    return new Date(
        date + "T00:00:00"
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


// ===============================
// UPDATE TASK STATISTICS
// ===============================

function updateStats() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    const active =
        total - completed;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    totalTasks.textContent =
        total;

    completedTasks.textContent =
        completed;

    activeTasks.textContent =
        active;


    progressPercentage.textContent =
        `${percentage}%`;


    progressText.textContent =
        `${completed} of ${total} tasks completed`;


    progressFill.style.width =
        `${percentage}%`;


    updateRewards();
}


// ===============================
// UPDATE REWARDS
// ===============================

function updateRewards() {

    const xp =
        rewards.xp;


    const coins =
        rewards.coins;


    const level =
        Math.floor(xp / 100) + 1;


    const currentLevelXP =
        xp % 100;


    const nextLevelXP =
        100;


    const rewardPercentage =
        currentLevelXP;


    xpValue.textContent =
        xp;


    coinValue.textContent =
        coins;


    levelBadge.textContent =
        `Level ${level}`;


    levelText.textContent =
        `Level ${level}`;


    levelXpText.textContent =
        `${currentLevelXP} / ${nextLevelXP} XP`;


    rewardProgressFill.style.width =
        `${rewardPercentage}%`;
}


// ===============================
// NOTIFICATION
// ===============================

let notificationTimeout;


function showNotification(message) {

    notification.textContent =
        message;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        notificationTimeout
    );


    notificationTimeout =
        setTimeout(() => {

            notification.classList.remove(
                "show"
            );

        }, 3000);
}


// ===============================
// FILTERS
// ===============================

document
    .querySelectorAll(".filter-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(
                        ".filter-btn"
                    )
                    .forEach(btn =>
                        btn.classList.remove(
                            "active"
                        )
                    );


                this.classList.add(
                    "active"
                );


                currentFilter =
                    this.dataset.filter;


                renderTasks();
            }
        );
    });


// ===============================
// DARK MODE
// ===============================

function applyTheme(theme) {

    if (theme === "dark") {

        document.documentElement
            .classList.add("dark");

        themeToggle.textContent =
            "☀️";

    } else {

        document.documentElement
            .classList.remove("dark");

        themeToggle.textContent =
            "🌙";
    }
}


// ===============================
// THEME TOGGLE
// ===============================

themeToggle.addEventListener(
    "click",
    function () {

        const isDark =
            document.documentElement
                .classList.contains("dark");


        const newTheme =
            isDark
                ? "light"
                : "dark";


        localStorage.setItem(
            "studyTheme",
            newTheme
        );


        applyTheme(newTheme);
    }
);


// ===============================
// LOAD SAVED THEME
// ===============================

const savedTheme =
    localStorage.getItem(
        "studyTheme"
    ) || "light";


applyTheme(savedTheme);


// ===============================
// INITIAL RENDER
// ===============================

renderTasks();