import { delegate, getRouteFromHash } from "./helpers.js";
import { Store } from "./store.js";

const Workouts = new Store("todo-key");

const App = {
    route: {
        page: null,
        workoutId: null,
        exerciseId: null,
    },
    _updateRoute() {
        const route = getRouteFromHash();
        App.route.page = route.page;
        App.route.workoutId = route.workout_id;
        App.route.exerciseId = route.exercise_id;
    },
    $: {
        linkBack: null,
        pageTitle: null,
        btnAdd: null,
        btnSaveOrCreate: null,
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
        App.$.btnSaveOrCreate     = document.querySelector('[app-id="btn-add-or-save"');
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
            App._updateRoute();
            App.render();
        });

        App.$.btnAdd.addEventListener("click", () => {
            App.$.editor.style.display      = "flex";
            App.$.btnAdd.style.visibility   = "hidden";
            App.$.btnSaveOrCreate.innerText = "Create";
        });

        App.$.btnSaveOrCreate.addEventListener("click", App.handleCreateAction);

        App.$.btnCancel.addEventListener("click", () => {
            App.$.editor.style.display    = "none";
            App.$.btnAdd.style.visibility = "visible";
        });

        delegate(App.$.dataTable, '[app-id="btn-edit"]', "click", (e, el) => {
            const $el = e.target.closest("tr");
            console.log("should do something")
            App.handleRemoveAction($el.dataset.id);
        });

        App._updateRoute();
        App.render();
    },
    handleCreateAction() {
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
    handleRemoveAction(id) {
        console.log("removeinfdsf");
        switch (App.route.page)
        {
            case "home":
                Workouts.removeWorkout(id);
                break;
            case "workout":
                console.log("insidhiehd the workot")
                Workouts.removeExercise(App.route.workoutId, id);
                break;
            case "exercise":
                Workouts.removeSet(App.route.workoutId, App.route.exerciseId, id);
                break;
        }
    },
    _renderAsHomePage() {
        // Navigation
        App.$.linkBack.style.visibility = "hidden";

        App.$.pageTitle.innerText = "Home";
        App.$.btnAdd.innerText    = "Add workout";


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
                    <td app-id="row-data">
                        <a href="#/workout/${workout.id}">${workout.name}</a>
                    </td>
                    <td>${workout.date}</td>
                    <td>
                        <i class="bx bx-edit" app-id="btn-edit"></i>
                        <i class="bx bx-trash" app-id="btn-trash"></i>
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
                    <td>
                        <a href="#/workout/${workout.id}/exercise/${exercise.id}">${exercise.name}</a>
                    </td>
                    <td>${exercise.num_sets}</td>
                    <td>${exercise.mean_rpe}</td>
                    <td>
                        <i class="bx bx-edit" app-id="btn-edit"></i>
                        <i class="bx bx-trash"></i>
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
                    <td>${set.repetitions}</td>
                    <td>${set.weight}</td>
                    <td>${set.rpe}</td>
                    <td>
                        <i class="bx bx-edit" app-id="btn-edit"></i>
                        <i class="bx bx-trash"></i>
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
