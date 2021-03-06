function fillRandomRecipe(random_recipe_str) {
    const random_recipe = str_to_dict(random_recipe_str)
    const container = document.querySelector('#randomRecipe');

    if (random_recipe) {
        // title
        const title = document.createElement('a');
        title.innerText = random_recipe.name;
        title.href = '/recipes/'.concat(random_recipe.id);
        title.classList = 'text-info h4 p-2 header-font'
        container.appendChild(title);

        // prep time
        if (random_recipe.prep_time) {
            const prep = document.createElement('p');
            prep.innerText = 'Prep Time: '.concat(random_recipe.prep_time, ' minutes');
            prep.classList = 'p-0 m-0 font-weight-light';
            container.appendChild(prep);
        }

        // cook time
        if (random_recipe.cook_time) {
            const cook = document.createElement('p');
            cook.innerText = 'Cook Time: '.concat(random_recipe.cook_time, ' minutes');
            cook.classList = 'p-0 m-0 font-weight-light';
            container.appendChild(cook);
        }

        // ingredients
        const ingredients_label = document.createElement('h6');
        ingredients_label.innerText = 'Ingredients';
        ingredients_label.classList = 'mt-3'
        container.appendChild(ingredients_label);

        let ingredient;
        for (let i of random_recipe.ingredients) {
            ingredient = document.createElement('p');
            ingredient.innerText = i.string;
            ingredient.classList = 'font-weight-light m-0'
            container.appendChild(ingredient);
        }
    } else {
        const label = document.createElement('h6');
        label.innerText = 'No Recipes';
        label.classList = 'mt-3'
        container.appendChild(label);
    }
}

function fillUpcomingMealPlan(meal_plan_str) {
    const meal_plan = str_to_dict(meal_plan_str)
    const container = document.querySelector('#upcomingMealPlan');

    if (meal_plan) {
        // date
        const date = document.createElement('a');
        date.innerText = meal_plan.date;
        date.href = '/mealplans/'.concat(meal_plan.id);
        date.classList = 'text-info h4 p-2 header-font'
        container.appendChild(date);

        // recipes
        const recipes_label = document.createElement('h6');
        recipes_label.innerText = 'Recipes';
        recipes_label.classList = 'mt-3'
        container.appendChild(recipes_label);

        let recipe;
        for (let r of meal_plan.recipes) {
            recipe = document.createElement('a');
            recipe.innerText = r.name;
            recipe.href = 'recipes/'.concat(r.id);
            recipe.classList = 'text-weight-light m-0 d-block text-info';
            container.appendChild(recipe);
        }

        // notes
        if (meal_plan.notes.length > 0) {
            const notes_label = document.createElement('h6');
            notes_label.innerText = 'Notes';
            notes_label.classList = 'mt-3'
            container.appendChild(notes_label);

            const notes = document.createElement('p');
            notes.innerText = meal_plan.notes;
            notes.classList = 'font-weight-light m-0'
            container.appendChild(notes);
        }
    } else {
        const label = document.createElement('h6');
        label.innerText = 'No Upcoming Meal Plans';
        label.classList = 'mt-3'
        container.appendChild(label);
    }
}

function addToGroceryList() {
    const add_field = $('#to_add')
    const new_item = add_field.val();
    if (new_item == '') {
        return false;
    }

    // send to database
    fetch(`/groceries`, {
        method: 'PUT',
        body: JSON.stringify({
            name: new_item,
            on_grocery_list: true
        })
    })
    .then(response => response.json())
    .then(json => {
        const category = json['category'];

        // set confirmation
        const confirm = $('#confirmAdd');
        if (json['was_added']) {
            confirm.text(`✓ ${new_item} was added to the list`)
        } else {
            confirm.text(`✓ ${new_item} is already on the list`)
        }
        confirm.addClass('rounded m-2 p-1')
        confirm.css('backgroundColor', "#c3f2c9")

        // if added, fix number in summary
        if (json['was_added']) {
            let to_fix = document.querySelector(`#${category}`);
            if (to_fix == null) {
                to_fix = document.createElement('p');
                to_fix.innerText = category.concat(': 0')
                to_fix.classList = 'font-weight-light m-0'
                to_fix.id = category;
                document.querySelector('#categories').appendChild(to_fix);
            }

            const current_val = to_fix.innerText.slice(category.length + 2);
            to_fix.innerText = category.concat(': ', parseInt(current_val) + 1);          
        }
    });

    // reset field
    add_field.val('')

    return false;
}

function fillCategories(categories_str) {
    const categories = str_to_dict(categories_str)
    const container = document.querySelector('#categories')

    // label
    const categories_label = document.createElement('h6');
    categories_label.innerText = 'Grocery List Summary';
        categories_label.classList = 'mt-3'
        container.appendChild(categories_label);

    let added_something = false;
    let category;
    for (let c in categories) {
        category = document.createElement('p');
        category.innerText = c.concat(': ', categories[c])
        category.classList = 'font-weight-light m-0'
        category.id = c;
        container.appendChild(category)
        added_something = true;
    }

    if (!(added_something)) {
        const label = document.createElement('h6');
        label.innerText = 'Nothing on the Grocery List';
        label.classList = 'mt-3'
        container.appendChild(label);
    }
}