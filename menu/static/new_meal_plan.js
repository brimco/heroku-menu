function set_edit_values(date, notes) {
    document.getElementById('notes').textContent = notes;
    document.getElementById('date').valueAsDate = new Date(date);
}

function set_default_values() {
    document.getElementById('date').valueAsDate = new Date();
}      

// function to save new plan
function submit_new_meal_plan(meal_plan_id=null) {
    console.log(1)
    const meal_plan = {};
    console.log(2)
    meal_plan['date'] = document.querySelector('#date').value;
    console.log(3)
    meal_plan['recipes'] = []
    console.log(4)
    document.querySelectorAll('.recipes').forEach(element => {
        console.log(5)
        if (element.selected) {
            console.log(6)
            meal_plan['recipes'].push(element.value);
        }
        console.log(7)
    });
    console.log(8)
    meal_plan['notes'] = document.querySelector('#notes').value;
    console.log(9)
    meal_plan['id'] = meal_plan_id;

    console.log(10)
    // send data via POST to be saved
    fetch("/mealplans/new", {
        method: 'POST',
        body: JSON.stringify(meal_plan)
    })
    .then(response => {
        console.log(`response: ${response}`)
        return response.json()
    })
    .then(json => {
        console.log(`json: ${json}`)
        console.log(11)
        // go to mealplan page
        location.href = '/mealplans/'.concat(json['id']);
        console.log(12)
    })
    .catch(error => {
        console.log(`Error saving meal plan: ${error}`)
    });
}