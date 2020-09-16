class Search extends React.Component {
    constructor(props) {
        super(props);
        const all_recipes = str_to_dict(this.props.all_recipes)
        
        // get starting list of all tags & all active tags
        const all_tags = [];
        const active_tags = [];
        for (let recipe of all_recipes) {
            for (let t of recipe['tags']) {
                if (!all_tags.includes(t)) {
                    all_tags.push(t);
                }
                if (this.props.search_tags != '' && t.toLowerCase().includes(this.props.search_tags.toLowerCase())) {
                    active_tags.push(t);
                }
            }
        }

        // set filter name and find name
        let filter_name = false;
        let find_name = ''
        if (this.props.find_name != null) {
            filter_name = true;
            find_name = this.props.find_name
        }
        console.log(`find name: ${find_name}, filter name: ${filter_name}`)

        // set filter tags
        let filter_tags = false;
        if (active_tags.length > 0) {
            filter_tags = true;
        }

        // set initial state
        this.state = {
            all_recipes: all_recipes,
            recipes_showing: all_recipes,
            filter_name: filter_name,
            find_name: find_name,
            filter_tags: filter_tags,
            all_tags: all_tags,
            active_tags: active_tags,
            filter_prep_time: false,
            prep_time_low: 0,
            prep_time_high: 100,
            filter_cook_time: false,
            cook_time_low: 0,
            cook_time_high: 100,
            filter_total_time: false,
            total_time_low: 0,
            total_time_high: 100,
            sort_by: 'name'
        }

        // preserve "this" so you can use it in the function
        this.handleChange = this.handleChange.bind(this);
        this.handleClickTag = this.handleClickTag.bind(this);
        this.sortBy = this.sortBy.bind(this);
    }

    // filter recipes when first loaded
    componentDidMount() {
        this.update_recipes_showing();
    }

    handleClickTag(event) {
        const tag = event.target.id;

        this.setState(state => {
            let new_active_tags;
            if (state.active_tags.includes(tag)) {
                // remove tag from active list
                new_active_tags = state.active_tags.filter(t => t != tag);
            } else {
                // add tag to active list
                new_active_tags = state.active_tags.concat(tag);
            }

            // reset state
            return {
                active_tags: new_active_tags,
            }
        })
        this.update_recipes_showing();
    }

    update_recipes_showing() {
        this.setState(state => {
            const new_recipes_showing = [];

            // check each filter
            for (let recipe of state.all_recipes) {
                let valid_tag;
                // tags
                if (state.filter_tags) {
                    valid_tag = false;
                    for (let tag of state.active_tags) {
                        if (recipe.tags.includes(tag)) {
                            valid_tag = true;
                        }
                    }
                } else {
                    valid_tag = true;
                }

                // prep time
                let valid_prep_time;
                if (!state.filter_prep_time) {
                    valid_prep_time = true;
                } else if (recipe.prep_time === null || recipe.prep_time == '') {
                    valid_prep_time = false;
                } else {
                    valid_prep_time = false;
                    if (state.prep_time_high >= recipe.prep_time && state.prep_time_low <= recipe.prep_time) {
                        valid_prep_time = true;
                    }
                } 

                // cook time
                let valid_cook_time;
                if (!state.filter_cook_time) {
                    valid_cook_time = true;
                } else if (recipe.cook_time === null || recipe.cook_time == '') {
                    valid_cook_time = false;
                } else {
                    valid_cook_time = false;
                    if (state.cook_time_high >= recipe.cook_time && state.cook_time_low <= recipe.cook_time) {
                        valid_cook_time = true;
                    }
                }

                // total time
                let valid_total_time;
                let recipe_total_time = 0;
                if (recipe.cook_time != null && recipe.cook_time != '') {
                    recipe_total_time += recipe.cook_time;
                }
                if (recipe.prep_time != null && recipe.prep_time != '') {
                    recipe_total_time += recipe.prep_time;
                }
                
                if (!state.filter_total_time) {
                    valid_total_time = true;
                } else if ((recipe.cook_time === null || recipe.cook_time == '') && (recipe.prep_time === null || recipe.prep_time == '')) {
                    valid_total_time = false;
                } else {
                    valid_total_time = false;
                    if (state.total_time_high >= recipe_total_time && state.total_time_low <= recipe_total_time) {
                        valid_total_time = true;
                    }
                }

                // substring of name
                let valid_substring = false;
                if (!state.filter_name) {
                    valid_substring = true;
                } else if (recipe.name.toLowerCase().includes(state.find_name.toLowerCase())) {
                    valid_substring = true;
                }

                // add to list to show if all are valid
                if (valid_tag && valid_prep_time && valid_cook_time && valid_total_time && valid_substring) {
                    new_recipes_showing.push(recipe);
                }
            }

            return {
                recipes_showing: new_recipes_showing,
            }
        })
        this.sortRecipes();
    }

    sortRecipes() {
        this.setState(state => {
            // if none
            if (state.all_recipes.length == 0) { 
                return {
                    recipes_showing: []
                }
            }
            if (typeof state.all_recipes[0][state.sort_by] === 'string') {
                // sort strings
                return {
                    recipes_showing: state.recipes_showing.sort((a,b) => {
                        return ('' + a[state.sort_by]).localeCompare(b[state.sort_by]);
                    })
                }
            }
            // sort numbers
            return {
                recipes_showing: state.recipes_showing.sort((a,b) => {
                    if (a[state.sort_by] == '') {
                        return 1
                    }
                    if (b[state.sort_by] == '') {
                        return -1
                    }
                    return a[state.sort_by] - b[state.sort_by]
                })
            }
        })
    }

    sortBy(event) {
        const sort_by = event.target.id;
        this.setState(state => {
            return {
                sort_by: sort_by
            }
        })
        this.sortRecipes()
    }

    handleChange(event) {
        const id = event.target.id;

        if (id.includes('filter')) {
            // toggle checkbox
            this.setState(state => {
                return {
                    [id]: !state[id]
                }
            })

        } else {
            // assign number
            let val = event.target.value;
            if (val < 0) {
                val = 0;
            }
            this.setState(state => {
                return {
                    [id]: val
                }
            })
        }
        this.update_recipes_showing();
    }

    render() {
        const results = [];
        const isMobile = is_mobile()

        // set up headings
        const labels = {
            name: 'Name',
            prep_time: 'Prep Time',
            cook_time: 'Cook Time'
        }
        const headers = [];
        for (let l of Object.keys(labels)) {
            let label = labels[l]
            if (l == this.state.sort_by) {
                label = label.concat(' ↓')
            }
            let cls = 'col-sm-3'
            if (l == 'name' && !isMobile) {
                cls = 'col-sm-6 text-left'
            }
            headers.push(
                <span className={cls} key={l}>
                    <button type='button' className='btn btn-link text-secondary' id={l} onClick={this.sortBy}>{label}</button>
                </span>
            )
        }

        // mobile headings
        if (isMobile) {
            results.push(
                <div key='headers'>
                    <button className='btn btn-sm btn-outline-info mb-3' type='button' data-toggle='collapse' data-target='#toggleSort'>
                        <span>Sort By:</span>
                    </button>

                    <div key='headers' className='collapse navbar-collapse' id='toggleSort'>
                        <div className='font-weight-light row'>
                            {headers}
                        </div>
                    </div>
                </div>
            )
        // desktop headings
        } else {
            results.push(
                <div key='headers' className='font-weight-light row'>
                    {headers}
                </div>
            )
        }

        // recipes
        for (let recipe of this.state.recipes_showing) {
            // cook time
            let cook = '-';
            if (recipe['cook_time']) {
                cook = String(recipe['cook_time']).concat(' min');
                if (isMobile) {
                    cook = 'Cook Time: '.concat(cook)
                }
            }
            // prep time
            let prep = '-';
            if (recipe['prep_time']) {
                prep = String(recipe['prep_time']).concat(' min');
                if (isMobile) {
                    prep = 'Prep Time: '.concat(prep)
                }
            }

            let title_justify = 'text-left'
            if (isMobile) {
                title_justify = 'text-center'
            }

            results.push(
                <div key={recipe['id']} className='border p-2 mb-3 rounded row position-relative bg-white'>
                    <span className={'col-sm-6'.concat(' ', title_justify)}>
                        <a href={'recipes/'+recipe['id']} className='stretched-link text-info h4 header-font'>{recipe['name']}</a>
                    </span>
                    <span className='col-sm-3'>
                        {prep}
                    </span>
                    <span className='col-sm-3'>
                        {cook}
                    </span>
                </div>
            )
        }
        // if no recipes
        if (results.length < 2) {
            results.push(
                <h5 className='text-left py-3' key='no recipes' >No Recipes</h5>
            )
        }

        // time filters
        let time_filters = []
        for (let each of ['prep', 'cook', 'total']) {
            time_filters.push(
                <div className='col-sm border my-2 p-2 bg-white' key={each}>
                    <div className='pb-2'>
                        <input type='checkbox' id={`filter_${each}_time`} value={this.state[`filter_${each}_time`]} onChange={this.handleChange}></input> {`${each.slice(0,1).toLocaleUpperCase().concat(each.slice(1))} Time`}:
                    </div>
                    <input type='number' id={`${each}_time_low`} value={this.state[`${each}_time_low`]} className='form-control d-inline ml-2 mr-2' style={{width: '8ch'}} disabled={!this.state[`filter_${each}_time`]} onChange={this.handleChange}></input>to 
                    <input type='number' id={`${each}_time_high`} value={this.state[`${each}_time_high`]} className='form-control d-inline ml-2 mr-2' style={{width: '8ch'}} disabled={!this.state[`filter_${each}_time`]} onChange={this.handleChange}></input>minutes
                </div>
            )
        }

        // tag filters
        const tag_buttons = [];
        for (let t of this.state.all_tags) {
            let color_class = ' badge-secondary';
            let btn_symbol = '+';
            if (this.state.active_tags.includes(t)) {
                color_class = ' badge-info';
                btn_symbol = '×';
            }
            tag_buttons.push(
                <div key={t} className='d-inline'>
                    <span className={'badge badge-pill font-weight-light ml-2 mb-2 d-inline'.concat(color_class)}>
                        <span>{t}</span>
                        <button id={t} type='button' onClick={this.handleClickTag} className='btn btn-link text-white align-baseline p-0 ml-1 position-relative stretched-link'>{btn_symbol}</button>
                    </span>               
                </div>
            )
        }

        return(
            <div className='text-center'>
                {/* Filters */}
                <div id='filters' className='collapse border shadow my-3 p-4 rounded'>

                    {/* substring of name */}
                    <div className='bg-white'>
                        <div className='border p-2'>
                            <span>
                                <input type='checkbox' id='filter_name' value={this.state.filter_name} checked={this.state.filter_name} onChange={this.handleChange}></input> Name:
                            </span>
                            <input type='text' id='find_name' value={this.state.find_name} className='form-control d-inline ml-2 mr-2' style={{width: '24ch'}} disabled={!this.state.filter_name} onChange={this.handleChange}></input>
                        </div>
                    </div>
                
                    {/* times */}
                    <div className='container'>
                        <div className='row'>
                            {time_filters}
                        </div>
                    </div>

                    {/* tags */}
                    <div className='bg-white'>
                        <div className='border p-2'>
                            <div>
                                <input type='checkbox' id='filter_tags' value={this.state.filter_tags} checked={this.state.filter_tags} onChange={this.handleChange}></input> Tags:
                            </div>
                            <div className='d-inline'>
                                {tag_buttons}
                            </div>
                        </div>
                    </div>
                </div>

                {/* results */}
                <div className='px-5'>
                    {results}
                </div>

            </div>
        )
    }
}