function set_edit_values(date, notes) {
    document.getElementById('notes').textContent = notes;
    document.getElementById('date').valueAsDate = new Date(date);
}

function set_default_values() {
    document.getElementById('date').valueAsDate = new Date();
}      

// function to save new plan
function submit_new_meal_plan(meal_plan_id=null) {
    const meal_plan = {};
    meal_plan['date'] = document.querySelector('#date').value;
    meal_plan['recipes'] = []
    document.querySelectorAll('.recipes').forEach(element => {
        if (element.selected) {
            meal_plan['recipes'].push(element.value);
        }
    });
    meal_plan['notes'] = document.querySelector('#notes').value;
    meal_plan['id'] = meal_plan_id;

    // send data via POST to be saved
    fetch("/mealplans/new", {
        method: 'POST',
        body: JSON.stringify(meal_plan)
    })
    .then(response => {
        return response.json()
    })
    .then(json => {
        // go to mealplan page
        location.href = '/mealplans/'.concat(json['id']);
    })
    .catch(error => {
        console.log(`Error saving meal plan: ${error}`)
    });
}