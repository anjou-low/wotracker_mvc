import { delegate, getRouteFromHash, validateKeyType, keyTypeErrorMessage } from "./helpers.js";
import { Store } from "./store.js";

const Workouts = new Store("todo-key");

const App = {
    route: {
        page: null,
        workoutId: null,
        exerciseId: null,
        render: null,
        navigate: null,
        getPageElement: null,
        /**
         * @param {number} workoutId   - The id of the workout containing the exercise.
         * @param {number} exerciseId  - The id of the exercise containing the set.
         * @param {number} repetitions - The number of repetitions of the set.
         * @param {number} weight      - The weight used for the set.
         * @param {number} rpe         - A number between 1 and 10 representing effort.
        **/
        editPageElement: null,
        deletePageElement: null,
    },
    _updateRoute() {
        const route = getRouteFromHash();
        App.route.page = route.page;
        App.route.workoutId = route.workout_id;
        App.route.exerciseId = route.exercise_id;

        switch (App.route.page)
        {
            case "home":
                App.route.render            = App._renderAsHomePage;
                App.route.navigate          = (workoutId) => window.location.hash = `/workout/${workoutId}`;
                App.route.createPageElement = () => Workouts.addWorkout("Legs", "2012-12-12");
                App.route.getPageElement    = (workoutId) => Workouts.getWorkout(workoutId);
                App.route.editPageElement   = (workout)   => Workouts.editWorkout(workout);
                App.route.movePageElementUp = () => { return; }
                App.route.movePageElementDown = () => { return; }
                App.route.deletePageElement = (workoutId) => Workouts.removeWorkout(workoutId);
                break;
            case "workout":
                App.route.render            = App._renderAsWorkoutPage;
                App.route.navigate          = (exerciseId) => window.location.hash = `/workout/${App.route.workoutId}/exercise/${exerciseId}`;
                App.route.createPageElement = () => Workouts.addExercise(App.route.workoutId, "Bar");
                App.route.getPageElement    = (exerciseId) => Workouts.getExerciseById(App.route.workoutId, exerciseId);
                App.route.editPageElement   = (exercise)   => Workouts.editExercise(App.route.workoutId, exercise);
                App.route.movePageElementUp = (exerciseId) => Workouts.moveExercise(App.route.workoutId, exerciseId, -1);
                App.route.movePageElementDown = (exerciseId) => Workouts.moveExercise(App.route.workoutId, exerciseId, 1);
                App.route.deletePageElement = (exerciseId) => Workouts.removeExercise(App.route.workoutId, exerciseId);
                break;
            case "exercise":
                App.route.render            = App._renderAsExercisePage;
                App.route.navigate          = () => { return; };
                App.route.createPageElement = () => Workouts.addSet(App.route.workoutId, App.route.exerciseId, 10, 10, 10);
                App.route.getPageElement    = (setId) => Workouts.getSetById(App.route.workoutId, App.route.exerciseId, setId);
                App.route.editPageElement   = (set)   => Workouts.editSet(App.route.workoutId, App.route.exerciseId, set);
                App.route.movePageElementUp = (setId) => Workouts.moveSet(App.route.workoutId, App.route.exerciseId, setId, -1);
                App.route.movePageElementDown = (setId) => Workouts.moveSet(App.route.workoutId, App.route.exerciseId, setId, 1);
                App.route.deletePageElement = (setId) => Workouts.removeSet(App.route.workoutId, App.route.exerciseId, setId);
                break;
        }
    },
    $: {
        linkBack: null,
        pageTitle: null,
        btnAdd: null,
        inputWorkoutName: null,
        inputWorkoutDate: null,
        inputExerciseName: null,
        inputExerciseTags: null,
        inputSetRepetitions: null,
        inputSetTags: null,
        inputSetRPE: null,
        dataTable: null
    },
    _showAlert(alertText) {
        App.$.alert.classList.add("show-alert");
        App.$.alertText.innerText = alertText;
        App.$.alert.animate([
            {opacity: 0}, {opacity: 1}
        ], {duration: 200});
    },
    _destroyAlert() {
        const fadeOut = App.$.alert.animate([
            {opacity: 1}, {opacity: 0}
        ], {duration: 200});
        fadeOut.addEventListener("finish", () => {
            App.$.alert.classList.remove("show-alert");
        });
    },
    init() {
        Workouts.addEventListener("save", App.render);

        App.$.clickInterceptor = document.querySelector(".click-intercept");

        App.$.alert     = document.querySelector(".alert");
        App.$.alertText = App.$.alert.querySelector("span");
        App.$.alertBtnClose = App.$.alert.querySelector("button");

        App.$.linkBack     = document.querySelector("#link-back");
        App.$.linkBackText = App.$.linkBack.querySelector("span");
        App.$.pageTitle    = document.querySelector("#page-title");
        App.$.btnAdd       = document.querySelector("#btn-add");
        App.$.thead        = document.querySelector("thead");
        App.$.tbody        = document.querySelector("tbody");

        window.addEventListener("hashchange", () => {
            console.log("HashChanged");
            App._updateRoute();
            App.render();
        });

        App.$.alertBtnClose.addEventListener("click", App._destroyAlert);

        App.$.clickInterceptor.addEventListener("click", (e) => {
            App.$.clickInterceptor.classList.remove("show-intercept");

            const modal = App.$.tbody.querySelector(".shown-modal");
            if (modal) {
                modal.classList.remove("shown-modal");
            }

            const input = App.$.tbody.querySelector(".shown");
            if (input) {
                input.trigger("focusout");
            }

            e.stopPropagation();
        });

        //TODO: Fix doesn't trigger on callback syntax.
        App.$.btnAdd.addEventListener("click", () => { App.route.createPageElement() });

        delegate(App.$.tbody, "td", "click", (e) => {
            App.route.navigate(e.target.closest("tr").dataset.id);
        });

        delegate(App.$.tbody, ".editable-entry span", "click", (e) => {
            console.log(e.target);
            const el    = e.target.closest("td");
            const input = el.querySelector("input");
            console.log(input);
            input.style.width = `${e.target.offsetWidth + 15}px`;
            input.classList.add("shown");
            input.select();
            input.focus();
        });

        delegate(App.$.tbody, ".editable-entry input", "keyup", (e) => {
            const el = e.target.closest("td");
            if (e.key == "Enter") {
                e.target.classList.remove("shown");

                const validation = validateKeyType(e.target.dataset.key, e.target.value.trim());
                if (!validation.success) {
                    App._showAlert(keyTypeErrorMessage[e.target.dataset.key]);
                }
                else {
                    App.route.editPageElement({
                        ...App.route.getPageElement(el.closest("tr").dataset.id),
                        [e.target.dataset.key]: validation.value
                    });
                }
            }
        });

        delegate(App.$.tbody, ".editable-entry input", "focusout", (e) => {
            const el = e.target.closest("td");
            e.target.value = el.querySelector(".editable-entry").innerText;
            e.target.classList.remove("shown");
        });

        //TODO: Fix choice of selector in following delegate.
        // Using "button" doesn't trigger click because the hitbox is tiny.
        delegate(App.$.tbody, "i", "click", (e) => {
            const el = e.target.closest("td");
            const modal = el.querySelector(".options-modal");
            modal.classList.add("shown-modal");
            App.$.clickInterceptor.classList.add("show-intercept");
        });

        delegate(App.$.tbody, "#option-delete", "click", (e) => {
            App.$.clickInterceptor.classList.remove("show-intercept");
            App.route.deletePageElement(e.target.closest("tr").dataset.id);
        });
        
        delegate(App.$.tbody, "#option-move-up", "click", (e) => {
            App.$.clickInterceptor.classList.remove("show-intercept");
            App.route.movePageElementUp(e.target.closest("tr").dataset.id);

        });

        delegate(App.$.tbody, "#option-move-down", "click", (e) => {
            App.$.clickInterceptor.classList.remove("show-intercept");
            App.route.movePageElementDown(e.target.closest("tr").dataset.id);
        });

        App._updateRoute();
        App.render();
    },
    _renderAsHomePage() {
        App.$.linkBackText.innerText  = "Back to root";
        App.$.pageTitle.innerText = "Home";
        App.$.btnAdd.innerText    = "Add workout";


        // Data table
        App.$.thead.replaceChildren();
        App.$.thead.insertAdjacentHTML("afterbegin", 
            `
                <tr>
                    <th>Workout</th>
                    <th>Date</th>
                    <th>&nbsp;</th>
                </tr>
            `
        );

        App.$.tbody.replaceChildren();
        for (const workout of Workouts.workouts) {
            const tr = document.createElement("tr");
            tr.dataset.id = workout.id;

            tr.insertAdjacentHTML("afterbegin", 
                `
                    <td>
                        <div class="editable-entry">
                            <span>${workout.name}</span>
                            <input type="text" value="${workout.name}" data-key="name">
                        </div>
                    </td>
                    <td>
                        <div class="editable-entry">
                            <span>${workout.date}</span>
                            <input type="date" value="${workout.date}" data-key="date">
                        </div>
                    </td>
                    <td>
                        <div style="position:relative;">
                            <button class="btn-more-options">
                                <i class="bx bx-dots-horizontal-rounded"></i>
                            </button>
                            <ul class="options-modal">
                                <li>
                                    <i class="bx bx-copy"></i>
                                    Copy as blueprint
                                </li>
                                <li id="option-delete">
                                    <i class="bx bx-trash"></i>
                                    Delete
                                </li>
                            </ul>
                        </div>
                    </td>
                `
            );

            App.$.tbody.appendChild(tr);
        }
    },
    _renderAsWorkoutPage() {

        const workout = Workouts.workouts.find((workout) => workout.id === App.route.workoutId);

        App.$.linkBackText.innerText = "Back to home";
        App.$.linkBack.href      = "#";

        App.$.pageTitle.innerText        = `${workout.name}`;
        App.$.btnAdd.innerText           = "Add exercise";

        App.$.thead.replaceChildren();
        App.$.thead.insertAdjacentHTML("afterbegin",
            `
                <tr>
                    <th>Exercise</th>
                    <th>Sets</th>
                    <th>RPE</th>
                    <th>&nbsp;</th>
                </tr>
            `
        );

        App.$.tbody.replaceChildren();
        for (const exercise of workout.exercises.sort((exerciseA, exerciseB) => exerciseA.index - exerciseB.index)) {
            const tr = document.createElement("tr");
            tr.dataset.id = exercise.id;


            tr.insertAdjacentHTML("afterbegin", 
                `
                    <td>
                        <div class="editable-entry">
                            <span>${exercise.name}</span>
                            <input type="text" value="${exercise.name}" data-key="name">
                        </div>
                    </td>
                    <td>${exercise.num_sets}</td>
                    <td>${exercise.mean_rpe}</td>
                    <td>
                        <div style="position:relative;">
                            <button class="btn-more-options">
                                <i class="bx bx-dots-horizontal-rounded"></i>
                            </button>
                            <ul class="options-modal">
                                ${exercise.index == 1 ? '' : '<li id="option-move-up"><i class="bx bx-up-arrow-alt"></i>Move up</li>'}
                                ${exercise.index == workout.exercises.length ? '' : '<li id="option-move-down"><i class="bx bx-down-arrow-alt"></i>Move down</li>'}
                                <li id="option-delete">
                                    <i class="bx bx-trash"></i>
                                    Delete
                                </li>
                            </ul>
                        </div>
                    </td>
                `
            );

            App.$.tbody.appendChild(tr);
        }
    },
    _renderAsExercisePage() {
        const workout = Workouts.getWorkout(App.route.workoutId);
        if (!workout) {
            console.log("ExercisePage::workoutDoesntExist");
            return;
        }

        const exercise = Workouts.getExercise(workout, App.route.exerciseId);
        if (!exercise) {
            console.log("ExercisePage::exerciseDoesntExist");
            return;
        }

        App.$.linkBackText.innerText = `Back to ${workout.name}`;
        App.$.linkBack.href      = `#/workout/${workout.id}`;

        App.$.pageTitle.innerText = `${exercise.name}`;
        App.$.btnAdd.innerText = "Add set";

        App.$.thead.replaceChildren();
        App.$.thead.insertAdjacentHTML("afterbegin",
            `
                <tr>
                    <th>Set</th>
                    <th>Reps</th>
                    <th>Weight</th>
                    <th>RPE</th>
                    <th>&nbsp;</th>
                </tr>
            `
        );

        App.$.tbody.replaceChildren();
        let count = 1;
        for (const set of exercise.sets.sort((setA, setB) => setA.index - setB.index)) {
            const tr = document.createElement("tr");
            tr.dataset.id = set.id;

            tr.insertAdjacentHTML("afterbegin", 
                `
                    <td>${set.index}</td>
                    <td>
                        <div class="editable-entry">
                            <span>${set.repetitions}</span>
                            <input type="text" value="${set.repetitions}" data-key="repetitions">
                        </div>
                    </td>
                    <td>
                        <div class="editable-entry">
                            <span>${set.weight}</span>
                            <input type="text" value="${set.weight}" data-key="weight">
                        </div>
                    </td>
                    <td>
                        <div class="editable-entry">
                            <span>${set.rpe}</span>
                            <input type="text" value="${set.rpe}" data-key="rpe" data-type="integer">
                        </div>
                    </td>
                    <td>
                        <div style="position:relative;">
                            <button class="btn-more-options">
                                <i class="bx bx-dots-horizontal-rounded"></i>
                            </button>
                            <ul class="options-modal">
                                ${set.index == 1 ? '' : '<li id="option-move-up"><i class="bx bx-up-arrow-alt"></i>Move up</li>'}
                                ${set.index == exercise.sets.length ? '' : '<li id="option-move-down"><i class="bx bx-down-arrow-alt"></i>Move down</li>'}
                                <li id="option-delete">
                                    <i class="bx bx-trash"></i>
                                    Delete
                                </li>
                            </ul>
                        </div>
                    </td>
                `
            );

            App.$.tbody.appendChild(tr);
            count++;
        }
    },
    render() {
        const route = getRouteFromHash();

        switch (route.page)
        {
            case "home":
                console.log("route says home");
                App._renderAsHomePage();
                break;
            case "workout":
                console.log("route says workout")
                App._renderAsWorkoutPage();
                break;
            case "exercise":
                console.log("route says exercise")
                App._renderAsExercisePage();
                break;
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    App.init();
    window.app = App;
    window.workouts = Workouts;
});
