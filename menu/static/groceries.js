class GroceryList extends React.Component {
    constructor(props) {
        super(props);
        const starting_list = JSON.parse(this.props.starting_list.replace(/&quot;/g, '"'));

        // sort categories in list by order

        this.state = {
            list: starting_list,
            to_add: '',
            reassigned_category: '',
            info_modal: '',
            new_category_name: ''
        }

        this.handleChange = this.handleChange.bind(this);
        this.addToList = this.addToList.bind(this);
        this.update = this.update.bind(this);
        this.reassign = this.reassign.bind(this);
        this.openReassignModal = this.openReassignModal.bind(this);
        this.clearAll = this.clearAll.bind(this);
    }

    update() {
        const names_to_remove = [];

        // find all checked boxes and PUT to database
        document.querySelectorAll('.checkbox').forEach(box => {
            if (box.checked) {
                // send to database to set on_grocery_list to false
                fetch(`/groceries`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: box.id,
                        on_grocery_list: false
                    })
                })
    
                // add to list to remove 
                names_to_remove.push(box.id);
            }
        })

        if (names_to_remove.length == 0) {
            this.setState(state=> {
                return {
                    info_modal: 'The update button will remove from the list any items that are checked off.'
                }
            })
            $('#infoModal').modal('show');
        }
        else {
            // make the new list
            const new_list = this.state.list;
            for (let category in new_list) {
                // filter out names for names_to_remove list
                new_list[category] = this.state.list[category].filter(each => !names_to_remove.includes(each.name));

                // delete category if empty
                if (new_list[category].length == 0) {
                    delete new_list[category];
                }
            }
            // update state
            this.setState(state=> {
                return {
                    list: new_list,
                }
            })
        }
    }

    openReassignModal() {
        let found = false;
        document.querySelectorAll('.checkbox').forEach(box => {
            if (box.checked) {
                // make sure new category box is empty
                this.setState(state => {
                    return {
                        new_category_name: ''
                    }
                })
                document.querySelector('#new_category_name').value = ''

                // show the modal
                $('#sortModal').modal('show');

                // set the default reassigned category as the first on the list
                this.setState(state => {
                    return {
                        reassigned_category: Object.keys(state.list)[0]
                    }
                })
                found = true;
            }
        })

        if (!found) {
            // update state
            this.setState(state=> {
                return {
                    info_modal: 'First check one or more items to be moved to a new category.'
                }
            })
            $('#infoModal').modal('show');
        }
    }

    reassign() {
        // hide modal
        $('#sortModal').modal('hide');
        const names_to_reassign = [];
        let new_category = this.state.reassigned_category;
        if (this.state.new_category_name != '') {
            new_category = this.state.new_category_name
        }

        // find all checked boxes and PUT to database
        document.querySelectorAll('.checkbox').forEach(box => {
            if (box.checked) {
                // send to database to set new category
                fetch(`/groceries`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: box.id,
                        category: new_category
                    }) 
                })
    
                // add to list to move 
                names_to_reassign.push(box.id);
            }
        })

        // make the new list
        const new_list = this.state.list;
        for (let category in new_list) {
            // filter out names for names_to_move list
            new_list[category] = this.state.list[category].filter(each => !names_to_reassign.includes(each.name));

            // delete category if empty
            if (new_list[category].length == 0) {
                delete new_list[category];
            }
        }

        // add category if not yet exists
        if (!(new_category in this.state.list)) {
            new_list[new_category] = [];
        }

        // add back in the items into the new category
        for (let new_item of names_to_reassign) {
            new_list[new_category].push({
                name: new_item,
                category: new_category
            })
        }

        // update state
        this.setState(state=> {
            return {
                list: new_list,
            }
        })
    }

    addToList(event) {
        event.preventDefault();
        if (this.state.to_add == '') {
            return;
        }

        const new_list = this.state.list;
        fetch(`/groceries`, {
            method: 'PUT',
            body: JSON.stringify({
                name: this.state.to_add,
                on_grocery_list: true
            })
        })
        .then(response => response.json())
        .then(json => {
            const category = json['category'];

            // set confirmation
            const confirm = $('#confirmAdd');
            if (json['was_added']) {
                confirm.text(`✓ ${this.state.to_add} was added to the list`)
            } else {
                confirm.text(`✓ ${this.state.to_add} is already on the list`)
            }
            confirm.addClass('rounded p-1')
            confirm.css('backgroundColor', "#c3f2c9")

            let new_list = this.state.list;

            // add category if not yet exists
            if (!(category in this.state.list)) {
                new_list[category] = [];
            }

            // add item if not yet exists
            if (!(this.state.list[category].map(each => each.name).includes(this.state.to_add))) {
                new_list[category].push({
                    id: json['id'],
                    name: this.state.to_add
                });
            }

            // update state
            this.setState(state=> {
                return {
                    list: new_list,
                    to_add: ''
                }
            })
        });
    }

    handleChange(event) {
        let id = event.target.id;
        let val = event.target.value;
        this.setState(state => {
            return {
                [id]: val
            }
        })
    }

    verifyClearAll() {
        $('#deleteModal').modal('show');
    }

    clearAll() {
        // find all boxes and PUT to database
        document.querySelectorAll('.checkbox').forEach(box => {
            // send to database to set on_grocery_list to false
            fetch(`/groceries`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: box.id,
                    on_grocery_list: false
                })
            })
        })

        // update state to be blank
        this.setState(state=> {
            return {
                list: {},
            }
        })
    }

    render() {
        const groceries = [];
        const category_options = [];
        for (let category in this.state.list) { 
            groceries.push(
                <div key={category} className='card p-3'>
                    <div className='card-block'>
                        <CategoryList 
                            name = {category} 
                            items = {this.state.list[category]} 
                            handleSortItem = {this.sortItem}
                        />
                    </div>
                </div>
            )
            category_options.push(
                <option key={category} value={category}>{category}</option>
            )
        }

        // check for empty list
        if (groceries.length == 0) {
            groceries.push(
                <div className='p-5' key='empty'>
                    <h5 className='text-center py-3 my-3'>Your list is empty!</h5>
                </div>
            )
        }

        return (
            <div>
                <div className="row">
                    {/* buttons */}
                    <div className="col-md text-left pt-3 px-3">
                        <button className="btn btn-outline-info btn-sm" onClick={this.update}>
                            <img src='static/images/refresh.svg' height="17" width="17" style={{verticalAlign: "-3px"}} className='p-0 m-0'></img>
                            <span className='pl-1'>Refresh</span>
                        </button>
                        <button className="btn btn-outline-info btn-sm ml-2" onClick={this.openReassignModal}>
                            <img src='static/images/move.svg' height="15" width="15" style={{verticalAlign: "-3px"}} className='p-0 m-0'></img>
                            <span className='pl-1'>Move to Category</span>
                        </button>
                        <button className="btn btn-outline-info btn-sm ml-2" onClick={this.verifyClearAll}>
                            <img src='static/images/trash.svg' height="15" width="15" style={{verticalAlign: "-3px"}} className='p-0 m-0'></img>
                            <span className='pl-1'>Clear All</span>
                        </button>
                    </div>

                    {/* add to list form */}
                    <div className='col-md pt-3 px-3 row ml-auto mobile-no-left-auto'>
                        <div className='col-sm mobile-center' id='confirmAdd'></div>
                        <div className='col-sm-auto mobile-center'> 
                            <form className="form-inline my-2 my-lg-0" onSubmit={this.addToList}>
                                <input className="form-control form-control-sm mr-2 mobile-max-width" type="search" placeholder="Add to List" id='to_add' onChange={this.handleChange} value={this.state.to_add}></input>
                                <button className="btn btn-link p-0" type="submit">
                                    <img src='static/images/add.svg' height="20" width="20" style={{verticalAlign: "-4px"}} className='p-0'></img> 
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                {/* title */}
                <h1 className='pt-3 col-md'>
                    <img src='static/images/list.svg' height="40" width="40" style={{verticalAlign: "bottom"}}></img>
                    Grocery List
                </h1>

                {/* groceries */}
                <div className="card-columns" id='groceryList'>
                    {groceries}
                </div> 

                {/* sort item modal */}
                <div className="modal fade" id="sortModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Reassign Category</h5>
                                <button type="button" className="close" data-dismiss="modal">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <span>Select a category: </span>
                                <select onChange={this.handleChange} id='reassigned_category' autoFocus>
                                    {category_options}
                                </select>
                                <div className='my-3'>
                                    <span className='mr-2'>Or add a new one:</span>
                                    <input type='text' id='new_category_name' onChange={this.handleChange}></input>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary" data-dismiss="modal">
                                    <img src='static/images/close.svg' height="20" width="20" style={{verticalAlign: "-5px"}} className='p-0 m-0'></img>
                                    <span>Close</span>
                                </button>
                                <button type="button" className="btn btn-outline-info" onClick={this.reassign}>
                                    <img src='static/images/check.svg' height="20" width="20" style={{verticalAlign: "-5px"}} className='p-0 m-0'></img>
                                    <span>Save</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* info modal */}
                <div className="modal fade" id="infoModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-body">
                                <p>
                                    {this.state.info_modal}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-info" data-dismiss="modal">
                                    <img src='static/images/check.svg' height="20" width="20" style={{verticalAlign: "-5px"}} className='p-0 m-0'></img>
                                    <span>Ok</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* verify delete modal */}
                <div className="modal fade" id="deleteModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-body">
                                <h5 className="text-center font-weight-normal">
                                    Are you sure you want to clear the grocery list?
                                </h5>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-info deleteButton" data-dismiss="modal" onClick={this.clearAll}>
                                    <img src='static/images/check.svg' height="20" width="20" style={{verticalAlign: '-5px'}} className='p-0 m-0'></img>
                                    Clear All
                                </button>
                                <button type="button" className="btn btn-outline-secondary" data-dismiss="modal">
                                    <img src='static/images/close.svg' height="20" width="20" style={{verticalAlign: '-5px'}} className='p-0 m-0'></img>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class Item extends React.Component {
    render() {
        return (
            <div key={this.props.item.name} className='text-left'>
                <input type="checkbox" id={this.props.item.name} className='mr-2 checkbox'></input>
                <label>{this.props.item.name}</label>
            </div>
        ) 
    }
}

class CategoryList extends React.Component {
    render() {
        let items = [];
        for (let item of this.props.items) {
            items.push(
                <div key={item.name}>
                    <Item item={item} sortItem={this.props.handleSortItem} />
                </div>
            )
        }
        return (
            <div key={this.props.name}>
                <h4 className="text-info">
                    {this.props.name}
                </h4>
                {items}
            </div>
        )
    }
}
