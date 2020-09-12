class RecipeGroceries extends React.Component {
    constructor(props) {
        super(props);
        const recipes = JSON.parse(this.props.recipes.replace(/&quot;/g, '"'));
        this.state = {
            recipes: recipes,
        }
    }

    add() {
        // find all checked boxes and PUT to database
        let found = false;
        document.querySelectorAll('.checkbox').forEach(box => {
            if (box.checked) {
                // send to database to set on_grocery_list to true
                fetch(`/groceries`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: box.id,
                        on_grocery_list: true
                    })
                })
                found = true;
            }
        })
        // ask to view grocery list or back to recipe
        if (found) {
            $('#finishedModal').modal('show');
        }
        else {
            $('#notFoundModal').modal('show');
        }
    }

    render() {
        const items = [];
        let ingredients;
        
        for (let recipe of this.state.recipes) {
            ingredients = [];
            for (let i of recipe.ingredients) {
                ingredients.push(
                    <div key={i.id}>
                        <input type="checkbox" id={i.food} className='mr-2 checkbox' defaultChecked></input>
                        <label>{i.food}</label>
                    </div>
                )
            }
            items.push(
                <div key={recipe.id}>
                    <h5 className="pt-3">{recipe.name}</h5>
                    <div className='row'>
                        <div className='mx-auto text-left'>
                            {ingredients}
                        </div>
                    </div>
                </div>
            )
        }

        // back button
        let ref = '/mealplans';
        let text = 'Back to Meal Plans';
        if (this.state.recipes.length == 1) {
            ref = '/recipes/'.concat(this.state.recipes[0].id)
            text = "Back to Recipe"
        }
        const back_button = (
            <a href={ref} className='btn btn-outline-info btn-sm'>
                <img src='/static/images/back.svg' height="15" width="15" style={{verticalAlign: "-2px"}} className='mr-1'></img>
                {text}
            </a> 
        )

        return (
            <div>
                {/* title stuff */}
                <div className="row">
                    <div className="col text-left p-3">
                        {back_button}
                    </div>
                    <h1 className='pt-3 col-auto'>
                        <img src='/static/images/list.svg' height="40" width="40" style={{verticalAlign: "-6px"}} className='mr-1'></img>
                        <span className='mobile-shrink-lots'>Add to Grocery List</span>
                    </h1>
                    <div className="col"></div>
                </div>

                <div>
                    {items}
                </div>

                {/* add button */}
                <button className="btn btn-outline-info m-3" onClick={this.add}>
                    <img src='/static/images/check.svg' height="20" width="20" style={{verticalAlign: "-3px"}} className='mr-1'></img>
                    Add
                </button>

                {/* finished modal */}
                <div className="modal fade" id="finishedModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header" style={{backgroundColor: "#6adf78"}}>
                                <h5 className="modal-title">&#10003; Added to Grocery List</h5>
                                <button type="button" className="close" data-dismiss="modal">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {back_button}
                                <a href='/groceries' className="btn btn-outline-info  btn-sm ml-2">
                                    <img src='/static/images/list.svg' height="20" width="20" style={{verticalAlign: "-4px"}} className='mr-1'></img>
                                    View Grocery List
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* not found modal */}
                <div className="modal fade" id="notFoundModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Check an item to add to the grocery list</h5>
                                <button type="button" className="close" data-dismiss="modal">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Ok</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}