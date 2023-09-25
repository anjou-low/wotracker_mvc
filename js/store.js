export const Store = class extends EventTarget {
    constructor(localStorageKey) {
        super();
        this.localStorageKey = localStorageKey;
        this._readStorage();


        this.getWorkout  = (id) => this.workouts.find((workout) => workout.id === id);
        this.getExercise = (workout, id) => workout.exercises.find((exercise) => exercise.id === id);
        this.getSet      = (exercise, id) => exercise.sets.find((set) => set.id === id);
    }

    _readStorage() {
        this.workouts = JSON.parse(window.localStorage.getItem(this.localStorageKey) || "[]");
    }

    _save() {
        window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.workouts));
        this.dispatchEvent(new CustomEvent("save"));
    }

    addWorkout(name, date) {

        this.workouts.push({
            id: Date.now(),
            name,
            date,
            tags: [],
            exercises: [],
        });

        this._save();
    }

    addExercise(workoutId, name) {
        const workout = this.getWorkout(workoutId);
        if (!workout) {
            console.log("Workout with given id does not exist");
            return;
        }

        workout.exercises.push({
            id: Date.now(),
            name,
            num_sets: 0,
            mean_rpe: 0,
            sets: [],
        });

        this._save();
    }

    /**
     * @param {number} workoutId   - The id of the workout containing the exercise.
     * @param {number} exerciseId  - The id of the exercise containing the set.
     * @param {number} repetitions - The number of repetitions of the set.
     * @param {number} weight      - The weight used for the set.
     * @param {number} rpe         - A number between 1 and 10 representing effort.
    **/
    addSet(workoutId, exerciseId, repetitions, weight, rpe) {
        const workout = this.getWorkout(workoutId);
        if (!workout) {
            console.log("addSet::workout_does_not_exist");
            return;
        }

        const exercise = this.getExercise(workout, exerciseId);
        if (!exercise) {
            console.log("addSet::exercise_does_not_exist");
            return;
        }

        exercise.sets.push({
            id: Date.now(),
            repetitions,
            weight,
            rpe,
        });

        exercise.num_sets = exercise.sets.length;
        exercise.mean_rpe = exercise.sets.reduce((acc, set) => acc + set.rpe) / exercise.num_sets;

        this._save();
    }

    removeWorkout(id) {
        console.log("removeWorkout::id=" + id);
        this.workouts = this.workouts.filter((workout) => workout.id != id);
        this._save();
    }

    removeExercise(workoutId, exerciseId) {
        const workout = this.getWorkout(workoutId);
        if (!workout) {
            console.log("removeExercise::workout_does_not_exist");
            return;
        }

        workout.exercises = workout.exercises.filter((exercise) => exercise.id != exerciseId);
        this._save();
    }

    removeSet(workoutId, exerciseId, setId) {
        const workout = this.getWorkout(workoutId);
        if (!workout) {
            console.log("removeSet::workout_does_not_exist");
            return;
        }

        const exercise = this.getExercise(workout, exerciseId);
        if (!exercise) {
            console.log("removeSet::execise_does_not_exist");
            return;
        }

        exercise.sets = exercise.sets.filter((set) => set.id != setId);

        exercise.num_sets = exercise.sets.length;
        exercise.mean_rpe = exercise.sets.reduce((acc, set) => acc + set.rpe, 0) / exercise.num_sets;

        this._save();
    }
}