class RecipeInfo extends React.Component {
    constructor(props) {
        super(props);
        const str = this.props.recipe.replace(/&quot;/g, '"');
        const recipe = JSON.parse(str); 

        this.state = {
            recipe: recipe,
            current_servings: recipe.servings
        }

        this.handleChange = this.handleChange.bind(this)
    }

    handleChange(event) {
        const id = event.target.id;
        const val = event.target.value;
        if (id == 'current_servings' && val < 0) {
            return;
        }
        this.setState(state => {
            return {
                [id]: val
            }
        })
    }

    to_decimal(num) {
        // whote number
        if (num == parseInt(num)) {
            return parseInt(num)
        }
        // split number: 1 1/2
        if (num.includes(' ')) {
            let nums = num.split(' ');
            let sum = 0;
            for (let n of nums) {
                sum += this.to_decimal(n);
            }
            return sum
        }
        // fraction
        if (num.includes('/')) {
            let nums = num.split('/');
            let div = this.to_decimal(nums[0]) / this.to_decimal(nums[1])
            return div
        }
        // range: 2-3 cups
        if (num.includes('-')) {
            // range, take the average
            let nums = num.split('-');
            let ave = (this.to_decimal(nums[0]) + this.to_decimal(nums[1])) / 2;
            return ave
        }
        console.log(`help converting to dec: ${num}`)
        return num
    }

    to_fraction(num) {
        const SHOW_ERRORS = false;
        const ROUND_WITH = 100;
        const DENOMINATOR_OPTIONS = [2,3,4,6,8]

        if (parseInt(num) == num) {
            return `${num}`
        }

        const whole_num = Math.floor(num);
        const decimal = parseFloat(num) - whole_num;

        let min_error = 100;
        let numerator
        let denominator;
        let error;

        let n;
        for (let d of DENOMINATOR_OPTIONS) {
            n = 1;
            while (n <= d){
                error = Math.abs((n / d) - decimal)
                if (error == 0) {
                    if (whole_num != 0) {
                        return `${whole_num} ${n}/${d}`
                    }
                    return `${n}/${d}`
                }
                if (error < min_error) {
                    numerator = n;
                    denominator = d;
                    min_error = error;
                }
                n++;    
            }
        }

        // check if rounded up to a whole number
        if (numerator == denominator) {
            if (SHOW_ERRORS) {
                let err = num - (whole_num + 1)
                if (err > 0) {
                    return `${whole_num + 1} + ${Math.round(err * ROUND_WITH) / ROUND_WITH}`   
                }
                return `${whole_num + 1} - ${-Math.round(err * ROUND_WITH) / ROUND_WITH}`
            }
            return `${whole_num + 1}`
        }

        if (SHOW_ERRORS) {
            let err = num - whole_num - (numerator/denominator)
            if (whole_num != 0) {
                if (err > 0) {
                    return `${whole_num} ${numerator}/${denominator} + ${Math.round(err * ROUND_WITH) / ROUND_WITH}`
                }
                return `${whole_num} ${numerator}/${denominator} - ${-Math.round(err * ROUND_WITH) / ROUND_WITH}`
            }
            if (err > 0) {
                return `${numerator}/${denominator} + ${Math.round(err * ROUND_WITH) / ROUND_WITH}`    
            }
            return `${numerator}/${denominator} - ${-Math.round(err * ROUND_WITH) / ROUND_WITH}`    
        }
        if (whole_num != 0) {
            return `${whole_num} ${numerator}/${denominator}`
        }
        return `${numerator}/${denominator}`
    }

    adjust_amount(old_amount) {
        // this will adjust the amounts if the user changes the number of servings
        if (!this.state.recipe.servings) {
            return old_amount
        }
        return this.to_fraction(this.to_decimal(old_amount) * this.state.current_servings / this.state.recipe.servings);
    }

    ingredient_string(ingredient) {
        let s = '';
        if (ingredient.amount) {
            s = s.concat(this.adjust_amount(ingredient.amount), ' ')
        }
        if (ingredient.unit) {
            s = s.concat(ingredient.unit, ' ')
        }
        if (ingredient.food) {
            s = s.concat(ingredient.food)
        }
        if (ingredient.description) {
            s = s.concat(', ', ingredient.description)
        }
        return s;
    }

    render() {
        // info line
        const info_line = []
        // prep time
        if (this.state.recipe.prep_time) {
            info_line.push(
                <div key='prep_time' className="col-sm m-2">Prep Time: {this.state.recipe.prep_time} minutes</div>
            )
        }
        // cook time
        if (this.state.recipe.cook_time) {
            info_line.push(
                <div key='cook_time' className="col-sm m-2">Cook Time: {this.state.recipe.cook_time} minutes</div>  
            )
        }

        // servings
        if (this.state.recipe.servings) {
            info_line.push(
                <div key='servings' className="col-sm m-2">
                    <span>Servings: </span>
                    <input id='current_servings' type='number' value={this.state.current_servings} onChange={this.handleChange} style={{width: '3em',borderStyle: 'solid', borderColor: 'lightGray', borderWidth: '1px'}}></input>
                     {/* show original servings if num is changed */}
                    <span className='font-weight-light pl-2' hidden={this.state.current_servings == this.state.recipe.servings}>
                        (Original: {this.state.recipe.servings})
                    </span>
                </div>  
            )      
        } 
        // source
        if (this.state.recipe.source) {
            info_line.push(
                <div key='source' className='col-sm m-2'>Source: {this.state.recipe.source}</div> 
            )
        }

        // ingredients
        const ingredients = [];
        for (let i of this.state.recipe.ingredients) {
            ingredients.push(
                <div key={i.food}>
                    <input type='checkbox' className="text-left ml-3 strikethrough"></input>
                    <span className='ml-2'>{this.ingredient_string(i)}</span>
                </div>
            )
        }

        // steps
        const steps = [];
        let step_num = 1;
        for (let step of this.state.recipe.steps) {
            steps.push(
                <div key={step_num}>
                    <input type='checkbox' className='text-left ml-3 strikethrough'></input>
                    <span key={step_num} className='ml-2'>{step_num}. {step}</span>
                </div>
            )
            step_num++;
        }

        return (
            <div>
                <div className="row rounded border bg-white mx-4 mt-4">
                    {info_line}
                </div>

                <div className="row m-3">
                    <div className='col-sm m-2 p-2 rounded border bg-white'>
                        <h4 className="m-2">Ingredients</h4>
                        <div className="text-left">
                            {ingredients}
                        </div>
                    </div>
                    <div className='col-sm m-2 p-2 rounded border bg-white'>
                        <h4 className="m-2">Steps</h4> 
                        <div className="text-left">
                            {steps}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}