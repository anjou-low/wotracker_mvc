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