import { delegate, getRouteFromHash } from "./helpers.js";
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
                App.route.getPageElement    = (workoutId) => Workouts.getWorkout(workoutId);
                App.route.editPageElement   = (workout)   => Workouts.editWorkout(workout);
                App.route.deletePageElement = (workoutId) => Workouts.removeWorkout(workoutId);
                break;
            case "workout":
                App.route.render            = App._renderAsWorkoutPage;
                App.route.navigate          = (exerciseId) => window.location.hash = `/workout/${App.route.workoutId}/exercise/${exerciseId}`;
                App.route.getPageElement    = (exerciseId) => Workouts.getExerciseById(App.route.workoutId, exerciseId);
                App.route.editPageElement   = (exercise)   => Workouts.editExercise(App.route.workoutId, exercise);
                App.route.deletePageElement = (exerciseId) => Workouts.removeExercise(App.route.workoutId, exerciseId);
                break;
            case "exercise":
                App.route.render            = App._renderAsExercisePage;
                App.route.navigate          = () => { return; };
                App.route.getPageElement    = (setId) => Workouts.getSetById(App.route.workoutId, App.route.exerciseId, setId);
                App.route.editPageElement   = (set)   => Workouts.editSet(App.route.workoutId, App.route.exerciseId, set);
                App.route.deletePageElement = (setId) => Workouts.removeSet(App.route.workoutId, App.route.exerciseId, setId);
                break;
        }
    },
    $: {
        linkBack: null,
        pageTitle: null,
        btnAdd: null,
        btnCancel: null,
        inputWorkoutName: null,
        inputWorkoutDate: null,
        inputExerciseName: null,
        inputExerciseTags: null,
        inputSetRepetitions: null,
        inputSetTags: null,
        inputSetRPE: null,
        dataTable: null
    },
    init() {
        Workouts.addEventListener("save", App.render);
        App.$.linkBack            = document.querySelector('[app-id="link-back"]');
        App.$.btnAdd              = document.querySelector('[app-id="btn-add"]');
        App.$.pageTitle           = document.querySelector('[app-id="page-title"]');
        App.$.editor              = document.querySelector('[app-id="editor"]');
        App.$.editorTitle         = document.querySelector('[app-id="editor-title"]');
        App.$.inputsWorkout       = document.querySelector('[app-id="inputs-workout"]');
        App.$.inputsExercise      = document.querySelector('[app-id="inputs-exercise"]');
        App.$.inputsSet           = document.querySelector('[app-id="inputs-set"]');
        App.$.btnCreate           = document.querySelector('[app-id="btn-create"]');
        App.$.btnCancel           = document.querySelector('[app-id="btn-cancel"]');
        App.$.inputWorkoutName    = document.querySelector('[app-id="input-workout-name"]');
        App.$.inputWorkoutDate    = document.querySelector('[app-id="input-workout-date"]');
        App.$.inputExerciseName   = document.querySelector('[app-id="input-exercise-name"]');
        App.$.inputExerciseTags   = document.querySelector('[app-id="input-exercise-tags"]');
        App.$.inputSetRepetitions = document.querySelector('[app-id="input-set-repetitions"]');
        App.$.inputSetTags        = document.querySelector('[app-id="input-set-tags"]');
        App.$.inputSetWeight      = document.querySelector('[app-id="input-set-weight"]');
        App.$.inputSetRPE         = document.querySelector('[app-id="input-set-rpe"]');
        App.$.dataTable           = document.querySelector('[app-id="data-table"]');

        window.addEventListener("hashchange", () => {
            console.log("HashChanged");
            App._updateRoute();
            App.render();
        });

        App.$.btnAdd.addEventListener("click", App._showEditor);

        App.$.btnCreate.addEventListener("click", App.handleCreateAction);

        App.$.btnCancel.addEventListener("click", App._hideEditor);

        delegate(App.$.dataTable, "td", "click", (e) => {
            App.route.navigate(e.target.closest("tr").dataset.id);
        });

        delegate(App.$.dataTable, "span", "click", (e) => {
            const el = e.target.closest("td");
            el.classList.add("editing");
            el.querySelector("input").focus();
            el.querySelector("input").select();
        });

        delegate(App.$.dataTable, '#btn-more-options', "click", (e) => {
            console.log(e.target);
           const list = e.target.closest("div").querySelector("div");
           list.classList.add("shown");
        });

        document.addEventListener("click", (e) => {
            if (e.target.matches("#btn-more-options")) { return; }
            const shown_option_modal = App.$.dataTable.querySelector(".shown");
            if (shown_option_modal) {
                shown_option_modal.classList.remove("shown");
                e.stopPropagation();
            }
        });

        delegate(App.$.dataTable, "#option-delete", "click", (e) => {
            App.route.deletePageElement(e.target.closest("tr").dataset.id);
        });

        delegate(App.$.dataTable, "input", "keyup", (e) =>
        {
            const el = e.target.closest("td");
            if (e.key === "Enter" && e.target.value.trim()) {
                el.closest("td").classList.remove("editing");
                App.route.editPageElement({
                    ...App.route.getPageElement(el.closest("tr").dataset.id),
                    [el.closest("td").dataset.key]: e.target.value.trim()
                });
            }
        });

        delegate(App.$.dataTable, "input", "focusout", (e) => {
            const el = e.target.closest("td");
            e.target.value = el.querySelector("span").innerText;
            el.classList.remove("editing");
        });

        App._updateRoute();
        App.render();
    },
    _editTableEntry(el, onEdit) {
        const current = el.innerText;
        el.innerText  = "";
        const input   = document.createElement("input");
        input.type    = "text";
        input.value   = current;
        el.appendChild(input);
        input.select();
        input.focus();

        input.addEventListener("keyup", (e) => {
            if (e.key == "Enter") {
                input.remove();
                onEdit(input.value);
            }
        });

        input.addEventListener("blur", () => {
            input.remove();
            el.innerText = current;
        });
    },
    _showEditor() {
        App.$.editor.style.display    = "flex";
        App.$.btnAdd.style.visibility = "hidden";
    },
    _hideEditor(clear=true) {
        App.$.editor.style.display    = "none";
        App.$.btnAdd.style.visibility = "visible";

        if (clear) {
            App.$.inputWorkoutName.value    = "";
            App.$.inputExerciseName.value   = "";
            App.$.inputSetRepetitions.value = "";
            App.$.inputSetWeight.value      = "";
            App.$.inputSetRPE.value         = "";
        }
    },
    handleCreateAction() {
        console.log("handleCreateAction::_");
        switch (App.route.page)
        {
            case "home":
                console.log("Should create a workout");
                const name = App.$.inputWorkoutName.value;
                const date = App.$.inputWorkoutDate.value;

                Workouts.addWorkout(name, date);
                break;
            case "workout":
                console.log("Should create an exercise");
                Workouts.addExercise(App.route.workoutId, App.$.inputExerciseName.value);
                break;
            case "exercise":
                console.log("Should create a set");
                Workouts.addSet(
                    App.route.workoutId,
                    App.route.exerciseId,
                    parseInt(App.$.inputSetRepetitions.value),
                    parseFloat(App.$.inputSetWeight.value),
                    parseInt(App.$.inputSetRPE.value),
                );
                break;
        }
        return;
    },
    _renderAsHomePage() {
        // Navigation
        App.$.linkBack.style.visibility = "hidden";

        App.$.pageTitle.innerText = "Home";
        App.$.btnAdd.innerText    = "Add workout";

        // Editor
        App.$.inputsWorkout.style.display  = "flex";
        const date                         = new Date();
        App.$.inputWorkoutDate.value       = date.toISOString().substring(0, 10);
        App.$.inputsExercise.style.display = "none";
        App.$.inputsSet.style.display      = "none";


        // Data table
        App.$.dataTable.replaceChildren();
        App.$.dataTable.insertAdjacentHTML("beforeend",
            `
                <tr>
                    <th>Workout</th>
                    <th>Date</th>
                    <th>&nbsp;</th>
                </tr>
            `
        );
        for (const workout of Workouts.workouts) {
            const tr = document.createElement("tr");
            tr.dataset.id = workout.id;

            tr.insertAdjacentHTML("afterbegin",
                `
                    <td app-id="row-data" data-key="name" style="cursor: pointer;">
                        <span style="cursor: text;">${workout.name}</span>
                        <input type="text" value="${workout.name}"></input>
                    </td>
                    <td app-id="workout-date" data-key="date">
                        <span>${workout.date}</span>
                        <input type="date" value="${workout.date}"></input>
                    </td>
                    <td>
                        <div class="dropdown">
                            <i id="btn-more-options" class="bx bx-dots-horizontal-rounded" style="font-size: 1.5rem; cursor: pointer;"></i>
                            <div class="dropdown-list">
                                <ul>
                                    <li id="option-copy">
                                        <i class="bx bx-copy"></i>
                                        Copy
                                    </li>
                                    <li id="option-delete">
                                        <i class="bx bx-trash"></i>
                                        Delete
                                    </li>
                                </ul>
                            </div>
                        </div> 
                    </td>
                `
            );

            App.$.dataTable.appendChild(tr);
        }
    },
    _renderAsWorkoutPage() {

        const workout = Workouts.workouts.find((workout) => workout.id === App.route.workoutId);

        // Navigation
        App.$.linkBack.style.visibility                = "visible";
        App.$.linkBack.href                            = "#";
        App.$.linkBack.querySelector("span").innerText = "Back to Home";
        App.$.pageTitle.innerText                      = `${workout.name} workout`
        App.$.btnAdd.innerText                         = "Add exercise";
        
        // Editor
        App.$.inputsWorkout.style.display  = "none";
        App.$.inputsExercise.style.display = "flex";
        App.$.inputsSet.style.display      = "none";


        // Assuming workout exists

        App.$.dataTable.replaceChildren();
        App.$.dataTable.insertAdjacentHTML("beforeend",
            `
                <tr>
                    <th>Exercise</th>
                    <th>Sets</th>
                    <th>Avg. RPE</th>
                    <th>&nbsp;</th>
                </tr>
            `
        );

        for (const exercise of workout.exercises)
        {
            const tr = document.createElement("tr");
            tr.dataset.id = exercise.id;

            tr.insertAdjacentHTML("afterbegin", 
                `
                    <td app-id="row-data" data-key="name">
                        <span>${exercise.name}</span>
                        <input type="text" value="${exercise.name}"></input>
                    </td>
                    <td app-id="exercise-sets">${exercise.num_sets}</td>
                    <td>${exercise.mean_rpe}</td>
                    <td>
                        <div class="dropdown">
                            <i id="btn-more-options" class="bx bx-dots-horizontal-rounded" style="font-size: 1.5rem; cursor: pointer;"></i>
                            <div class="dropdown-list">
                                <ul>
                                    <li id="option-move-up">
                                        <i class="bx bx-up-arrow-alt"></i>
                                        Up 
                                    </li>
                                    <li id="option-move-down">
                                        <i class="bx bx-down-arrow-alt"></i>
                                        Down
                                    </li>
                                    <li id="option-delete">
                                        <i class="bx bx-trash"></i>
                                        Delete
                                    </li>
                                </ul>
                            </div>
                        </div> 
                    </td>
                `
            );
            
            App.$.dataTable.appendChild(tr);
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

        // Navigation
        App.$.linkBack.style.visibility                = "visible";
        App.$.linkBack.href                            = `#/workout/${App.route.workoutId}`;
        App.$.linkBack.querySelector("span").innerText = `Back to ${workout.name} workout`;

        App.$.btnAdd.innerText           = "Add set";
        App.$.pageTitle.innerText        = `${exercise.name}`;

        // Editor
        App.$.inputsWorkout.style.display  = "none";
        App.$.inputsExercise.style.display = "none";
        App.$.inputsSet.style.display      = "flex";

        // Table
        App.$.dataTable.replaceChildren();
        App.$.dataTable.insertAdjacentHTML("beforeend",
            `
                <tr>
                    <th>Set</th>
                    <th>Repetitions</th>
                    <th>Weight</th>
                    <th>RPE</th>
                    <th>&nbsp;</th>
                </tr>
            `
        );

        for (const set of exercise.sets)
        {
            const tr      = document.createElement("tr");
            tr.dataset.id = set.id;

            tr.insertAdjacentHTML("afterbegin", 
                `
                    <td>${set.id}</td>
                    <td data-key="repetitions">
                        <span>${set.repetitions}</span>
                        <input type="text" value="${set.repetitions}"></input>
                    </td>
                    <td data-key="weight">
                        <span>${set.weight}</span>
                        <input type="text" value="${set.weight}"></input>
                    </td>
                    <td data-key="rpe">
                        <span>${set.rpe}</span>
                        <input type="text" value="${set.rpe}"></input>
                    </td>
                    <td>
                        <div class="dropdown">
                            <i id="btn-more-options" class="bx bx-dots-horizontal-rounded" style="font-size: 1.5rem; cursor: pointer;"></i>
                            <div class="dropdown-list">
                                <ul>
                                    <li id="option-move-up">
                                        <i class="bx bx-up-arrow-alt"></i>
                                        Up 
                                    </li>
                                    <li id="option-move-down">
                                        <i class="bx bx-down-arrow-alt"></i>
                                        Down
                                    </li>
                                    <li id="option-delete">
                                        <i class="bx bx-trash"></i>
                                        Delete
                                    </li>
                                </ul>
                            </div>
                        </div> 
                    </td>
                `
            );

            App.$.dataTable.appendChild(tr);
        }
    },
    render() {
        App.$.dataTable.replaceChildren();

        const route = getRouteFromHash();

        App.$.btnAdd.style.visibility = "visible";
        App.$.editor.style.display    = "none";

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
