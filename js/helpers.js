export const getRouteFromHash = () => {
    const route = {
        page: null,
        workout_id: null,
        exercise_id: null,
    };

    const splittedHash = document.location.hash.split("/");
    if (splittedHash.length <= 1) { // # || ""
        route.page = "home";
    }
    else if (splittedHash.length === 3) { // #/workout/id
        route.page = "workout";
        route.workout_id = parseInt(splittedHash[2]);
    }
    else if (splittedHash.length === 5) { // #/workout/id/exercise/id

        route.page = "exercise";
        route.workout_id  = parseInt(splittedHash[2]);
        route.exercise_id = parseInt(splittedHash[4]);
    }

    return route;
}
export const delegate = (el, selector, event, handler) => {
	el.addEventListener(event, (e) => {
		if (e.target.matches(selector)) handler(e, el);
	});
};

const isInt = (value) => {
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

export const validateKeyType = (key, value) => {
    switch (key)
    {
        case "weight": {
            if (isNaN(value)) { return { success: false, value: NaN }; }
            return { success: true, value: parseFloat(value) };
        }
        case "rpe": {
            if (!isInt(value)) { return { success: false, value: NaN}; }
            const integerValue = parseInt(value);
            if (integerValue < 0 || integerValue > 10) { return { success: false, value: integerValue }; }
            return { success: true, value: integerValue };
        }
        case "repetitions": {
            if (!isInt(value)) { return { success: false, value: NaN }; }
            const integerValue = parseInt(value);
            if (integerValue < 0) { return { success: false, value: integerValue}; }
            return { success: true, value: integerValue };
        }
        case "name": {
            if (value.length === 0) { return { success: false, value }; }
            return { success: true, value };
        }
        default:
            return { success: true, value };
    }
}

export const keyTypeErrorMessage = {
    weight: "Weight needs to be a decimal number.",
    rpe: "RPE needs to be an integer between 0 and 10.",
    repetitions: "Reps needs to be a positive integer.",
    name: "Name needs to be nonempty."
}