export const Store = class extends EventTarget {
    constructor(localStorageKey) {
        super();
        this.localStorageKey = localStorageKey;
        this._readStorage();


        this.getWorkout  = (id) => this.workouts.find((workout) => workout.id == id);

        this.getExercise = (workout, id) => workout.exercises.find((exercise) => exercise.id === id);

        this.getExerciseById = (workoutId, exerciseId) => this.workouts.find(workout => workout.id == workoutId)
                                                                ?.exercises.find(exercise => exercise.id == exerciseId);

        this.getSetById = (workoutId, exerciseId, setId) => this.workouts.find(workout => workout.id === workoutId)
                                                                ?.exercises.find(exercise => exercise.id == exerciseId)
                                                                ?.sets.find(set => set.id == setId);

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

    editWorkout(workout) {
        console.log("editWorkout::_");
        console.log(workout);
        this.workouts = this.workouts.map(w => w.id === workout.id ? workout : w);
        this._save();
    }

    removeWorkout(id) {
        this.workouts = this.workouts.filter((workout) => workout.id != id);
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
            index: workout.exercises.length + 1,
            name,
            num_sets: 0,
            mean_rpe: 0,
            sets: [],
        });

        this._save();
    }

    moveExercise(workoutId, exerciseId, value) {
        const workout  = this.getWorkout(workoutId);
        const target   = workout.exercises.find(exercise => exercise.id == exerciseId);
        const swapped  = workout.exercises.find(exercise => exercise.index == target.index + value);
        target.index  += value;
        swapped.index -= value;

        this._save();
    }

    editExercise(workoutId, exercise) {
        const workout = this.getWorkout(workoutId);

        workout.exercises = workout.exercises.map(e => e.id === exercise.id ? exercise : e);
        this._save();
    }

    removeExercise(workoutId, exerciseId) {
        const workout = this.getWorkout(workoutId);
        if (!workout) {
            console.log("removeExercise::workout_does_not_exist");
            return;
        }

        const exerciseIndex = workout.exercises.find(exercise => exercise.id == exerciseId).index;
        workout.exercises = workout.exercises.filter(exercise => exercise.id != exerciseId);
        workout.exercises = workout.exercises.map(exercise => (exercise.index > exerciseIndex) ? {...exercise, index: exercise.index - 1} : exercise);

        this._save();
    }

    _onExerciseModified(exercise) {
        exercise.num_sets = exercise.sets.length;
        if (exercise.num_sets > 0) {
            exercise.mean_rpe = exercise.sets.reduce((acc, set) => acc + parseInt(set.rpe), 0) / exercise.num_sets;
        }
        else { exercise.mean_rpe = 0; }

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
            index: exercise.sets.length + 1,
            repetitions,
            weight,
            rpe,
        });

        this._onExerciseModified(exercise);

        this._save();
    }

    moveSet(workoutId, exerciseId, setId, value) {
        const exercise = this.getExerciseById(workoutId, exerciseId);
        const target   = exercise.sets.find(set => set.id == setId);
        const swapped  = exercise.sets.find(set => set.index == target.index + value);
        target.index  += value;
        swapped.index -= value;

        this._save();
    }

    editSet(workoutId, exerciseId, set)
    {
        const exercise = this.getExerciseById(workoutId, exerciseId);
        exercise.sets  = exercise.sets.map(s => s.id === set.id ? set : s);

        this._onExerciseModified(exercise);

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

        const setIndex = exercise.sets.find((set) => set.id == setId).index;
        exercise.sets  = exercise.sets.filter((set) => set.id != setId);
        exercise.sets  = exercise.sets.map((set) => (set.index > setIndex) ? {...set, index: set.index -1} : set);

        this._onExerciseModified(exercise);

        this._save();
    }
}