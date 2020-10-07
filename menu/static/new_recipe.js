class Ingredients extends React.Component {
    constructor(props) {
        super(props);

        let edit_recipe = null;
        let num_ingredients = 3;

        // check if editing
        if (this.props.edit_recipe) {
            edit_recipe = str_to_dict(this.props.edit_recipe)

            // add steps
            if (edit_recipe.ingredients.length > 0) {
                num_ingredients = edit_recipe.ingredients.length;
            }
        } 

        // update state
        this.state = {
            num_ingredients: num_ingredients,
            edit_recipe: edit_recipe,
            added_ingredient: false
        }
    }

    add_ingredient = () => {
        this.setState(state => ({
            num_ingredients: state.num_ingredients + 1,
            added_ingredient: true
        }))
    }
    
    render() {
        let items = []
        const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

        // headers
        if (isMobile) {
            items.push(
                <div key={'headers'} className='text-center'>
                    <div key='headers'>
                        <label className='h4 header-font'>Ingredients</label>
                    </div>
                </div>
            )
        } else {
            items.push(
                <div key={'headers'} className='text-center'>
                    <div key='headers'>
                        <label className='h4 header-font'>Ingredients</label>
                    </div>
                    <label className='d-inline-block' style={{width: '4%'}}></label>
                    <label className='d-inline-block' style={{width: '12%'}}>Amount</label>
                    <label className='d-inline-block' style={{width: '10%'}}>Unit</label>
                    <label className='d-inline-block' style={{width: '37%'}}>Ingredient</label>
                    <label className='d-inline-block' style={{width: '37%'}}>Description</label>
                </div>
            )
        }

        //ingredient rows
        for (let i = 1; i <= this.state.num_ingredients; i++) {
            let defaults = {
                amount: '', 
                unit: '',
                ingredient: '',
                description: ''
            }
            if (this.state.edit_recipe) {
                let ing = this.state.edit_recipe.ingredients[i - 1];
                if (ing) {
                    defaults = {
                        amount: ing.amount,
                        unit: ing.unit,
                        ingredient: ing.food,
                        description: ing.description
                    }   
                }
            }

            let focus = false
            if (this.state.added_ingredient && i == this.state.num_ingredients) {
                focus = true;
            }

            if (isMobile) {
                items.push(
                    <div key={'ingredient-'.concat(i)}>
                        <div className='text-center'>{`Ingredient ${i}:`}</div>
                        <div className='input-group input-group-sm mb-2'>
                            <div className='input-group-prepend'>
                                <span className='input-group-text'>Amount</span>
                            </div>
                            <input autoFocus={focus} type="text" className='form-control ingredient' id={i} name='amount' defaultValue={defaults['amount']} style={{width: '5%'}}></input>
                        </div>
                        <div className='input-group input-group-sm mb-2'>
                            <div className='input-group-prepend'>
                                <span className='input-group-text'>Unit</span>
                            </div>
                            <input type="text" className='form-control ingredient' id={i} name='unit' defaultValue={defaults['unit']}></input>
                        </div>
                        <div className='input-group input-group-sm mb-2'>
                            <div className='input-group-prepend'>
                                <span className='input-group-text'>Ingredient</span>
                            </div>
                            <input type="text" className='form-control ingredient' id={i} name='ingredient' defaultValue={defaults['ingredient']} style={{width: '30%'}}></input>
                        </div>
                        <div className='input-group input-group-sm mb-4'>
                            <div className='input-group-prepend'>
                                <span className='input-group-text'>Description</span>
                            </div>
                            <input type="text" className='form-control ingredient' id={i} name='description' defaultValue={defaults['description']} style={{width: '30%'}}></input>
                        </div>
                        
                    </div>
                )
            } else {
                items.push(
                    <div key={'ingredient-'.concat(i)} className='input-group input-group-sm mb-3'>
                        <div className='input-group-prepend'>
                            <span className='input-group-text'>{i}.</span>
                        </div>
                        <input autoFocus={focus} type="text" className='form-control ingredient' id={i} name='amount' defaultValue={defaults['amount']} style={{width: '5%'}}></input>
                        <input type="text" className='form-control ingredient' id={i} name='unit' defaultValue={defaults['unit']}></input>
                        <input type="text" className='form-control ingredient' id={i} name='ingredient' defaultValue={defaults['ingredient']} style={{width: '30%'}}></input>
                        <input type="text" className='form-control ingredient' id={i} name='description' defaultValue={defaults['description']} style={{width: '30%'}}></input>
                    </div>
                )
            }
        }
        // button
        let btn_align = 'text-left'
        if (isMobile) {
            btn_align = 'text-center'
        }
        items.push(
            <div key='button' className={btn_align}>
                <button type='button' onClick={this.add_ingredient} className='btn btn-outline-info btn-sm'>
                    <img src={this.props.add_src} height="15" width="15" style={{verticalAlign: "-2px"}} className='mr-1'></img>
                    <span>Add Ingredient</span>
                </button>
            </div>
        )

        return (
            <div>
                {items}
            </div>
        )
    }
}


class Steps extends React.Component {
    constructor(props) {
        super(props);

        let edit_recipe = null;
        let num_steps = 1;
        if (this.props.edit_recipe) {
            edit_recipe = str_to_dict(this.props.edit_recipe)

            // add steps
            if (edit_recipe.steps.length > 0) {
                num_steps = edit_recipe.steps.length;
            }
        }

        this.state = {
            num_steps: num_steps,
            edit_recipe: edit_recipe,
            added_step: false
        }
    }

    add_step = () => {
        this.setState(state => ({
            num_steps: state.num_steps + 1,
            added_step: true
        }))
    }
    
    render() {
        let items = [];

        // headers
        items.push(
            <div key='headers' className='text-center'>
                <label className='h4 header-font'>Steps</label>
            </div>
        );

        // step rows
        for (let i = 1; i <= this.state.num_steps; i++) {
            let default_value = '';
            if (this.state.edit_recipe) {
                default_value = this.state.edit_recipe.steps[i - 1]
            }

            let focus_step = false
            if (this.state.added_step && i == this.state.num_steps) {
                focus_step = true;
            } 

            items.push(
                <div key={'step-'.concat(i)} id={'step-'.concat(i)} className='input-group input-group-sm mb-3'>
                    <div className='input-group-prepend'>
                        <span className='input-group-text'>{i}.</span>
                    </div>
                    <textarea autoFocus={focus_step} className='form-control step' id={'step-'.concat(i)} defaultValue={default_value}></textarea>
                </div>                
            )
        }
        // button
        let btn_align = 'text-left'
        const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
        if (isMobile) {
            btn_align = 'text-center'
        }

        items.push(
            <div key='button' className={btn_align}>
                <button type='button' onClick={this.add_step} className='btn btn-outline-info btn-sm'>
                    <img src={this.props.add_src} height="15" width="15" style={{verticalAlign: "-2px"}} className='mr-1'></img>
                    <span>Add Step</span>
                </button>
            </div>
        )

        return (
            <div>
                {items}
            </div>
        )
    }
}


class Tags extends React.Component {
    constructor(props) {
        super(props);
        tag_options = str_to_dict(this.props.tag_options)

        let edit_recipe = null;
        let current_tags = [];
        // set up to edit if editing
        if (this.props.edit_recipe) {
            edit_recipe = str_to_dict(this.props.edit_recipe)
            
            // set current and options tags
            for (let tag of edit_recipe.tags) {
                current_tags = current_tags.concat(tag);
                tag_options = tag_options.filter(t => t != tag);
            }
        } 

        this.state = {
            current_tags: current_tags.sort(),
            tag_options: tag_options.sort(),
            edit_recipe: edit_recipe
        }
    }

    handleTagClick = (event) => {
        const tag = event.target.id
        if (this.state.current_tags.includes(tag)) {
            this.remove_tag(tag)
        }
        else {
            this.add_tag(tag)
        }
    }

    add_tag = (new_tag) => {
        this.setState(state => {
            const new_current_tags = state.current_tags.concat(new_tag);
            const new_tag_options = state.tag_options.filter(t => t != new_tag);
            return {
                current_tags: new_current_tags.sort(),
                tag_options: new_tag_options
            }
        })
    }
    
    remove_tag = (tag_to_remove) => {
        this.setState(state => {
            const new_current_tags = state.current_tags.filter(t => t != tag_to_remove);
            const new_tag_options = state.tag_options.concat(tag_to_remove);
            return {
                current_tags: new_current_tags,
                tag_options: new_tag_options.sort()
            }
        })
    }

    create_new_tag = () => {
        const input_field = document.querySelector('#new_tag_field');
        const val = input_field.value.charAt(0).toUpperCase() + input_field.value.slice(1).trim();
        if (val !== '' && !this.state.current_tags.includes(val) && !this.state.tag_options.includes(val)) {
            this.add_tag(val);
        }
        input_field.value = '';
    }

    handleKeyDown = (event) => {
        // allow enter to submit new tag
        const input_field = document.querySelector('#new_tag_field');
        if (event.key == 'Enter') {
            event.preventDefault();
            this.create_new_tag();
        }
        return false;
    }

    render() {
        let items = [];
        // current tags
        for (let tag of this.state.current_tags) {
            items.push(
                <div key={tag} className='d-inline-block mb-2'>
                    <span className='badge badge-pill badge-info font-weight-normal p-2 m-1 d-inline'>
                        <span className='current_tag'>{tag}</span>
                        <button id={tag} type='button' onClick={this.handleTagClick} className='btn btn-link text-white align-baseline p-0 ml-1'>&times;</button> 
                    </span>               
                </div>
            )
        }

        items.push(<hr key='separator'></hr>)
        // existing tags to add
        if (this.state.tag_options.length > 0) {
            items.push(
                <div key='existing-tags-label' className='d-inline-block'>
                    <span>Add a Tag:</span>
                </div>
            )
        }
        for (let tag of this.state.tag_options) {
            items.push(
                <div key={'add-'.concat(tag)} className='d-inline'>
                    <span className='badge badge-pill badge-secondary font-weight-normal ml-2 mb-2 d-inline'>
                        {tag}
                        <a id={tag} onClick={this.handleTagClick} className='stretched-link btn btn-link text-white align-baseline p-0 ml-1'>+</a>
                    </span>
                </div>
            )
        }

        // add a new tag
        items.push(
            <div key='create-tag' className='input-group input-group-sm mb-3 mt-3'>
                <div className='input-group-prepend' id='newRecipeTag'>
                    <span className='input-group-text'>Create New Tag</span>
                </div>
                <input type="text" className='form-control' id='new_tag_field' style={{width: '10%'}} onKeyDown={this.handleKeyDown}></input>
                <div className='input-group-append'>
                    <button className="btn btn-outline-info" id='new_tag_btn' type="button" onClick={this.create_new_tag}>
                        <img src={this.props.add_src} height="20" width="20" style={{verticalAlign: "-4px"}} className='p-0 m-0'></img>
                    </button>
                </div>
            </div>
        )

        return (
            <div>
                {items}
            </div>
        )
    }
}

function submit_new_recipe(recipe_id=null) {
    const recipe = {};
    const fields = ['name','preptime','cooktime','servings','source'];
    for (let i = 0; i < fields.length; i++) {
        recipe[fields[i]] = document.querySelector(`#${fields[i]}`).value;
    }         

    // tags
    const tags = [];
    document.querySelectorAll('.current_tag').forEach(tag => {
        tags.push(tag.innerHTML);
    })
    recipe['tags'] = tags;

    // ingredients
    const ingredients = {};
    document.querySelectorAll('.ingredient').forEach(ing => {
        // id is the ingredient number, name is amount/unit/food/description
        if (ing.value != '') {
            if (!(ing.id in ingredients)) {
                ingredients[ing.id] = {}
            }
            ingredients[ing.id][ing.name] = ing.value;
        }
    })
    const lst_ingredients = [];
    for (const i in ingredients) {
        lst_ingredients.push(ingredients[i]);
    }
    recipe['ingredients'] = lst_ingredients;
 
    // steps
    const steps = [];
    document.querySelectorAll('.step').forEach(step => {
        if (step.value !== '') {
            steps.push(step.value);
        }
    })
    recipe['steps'] = steps;
    recipe['id'] = recipe_id;

    // send data via POST to be saved
    fetch("/recipes/new", {
        method: 'POST',
        body: JSON.stringify(recipe)
    })
    .then(response =>  {
        console.log('response: ')
        console.log(response)
        console.log('text: ')
        console.log(response.text())
        return response.json()
    })
    .then(json => {
        console.log(`New recipe post response:`)
        console.log(json)

        // location.href = '/recipes/'.concat(json['id']);
    })
    .catch(error => {
        console.log(`Error saving new recipe: ${error}`)
    });
}