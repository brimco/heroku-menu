class GroceryCategories extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            categories: str_to_dict(this.props.categories),
            new_category: '',
            category_to_edit: '',
            edited_name: ''
        }

        this.moveUp = this.moveUp.bind(this)
        this.moveDown = this.moveDown.bind(this)
        this.edit = this.edit.bind(this)
        this.saveEdits = this.saveEdits.bind(this)
        this.delete = this.delete.bind(this)
        this.confirmDelete = this.confirmDelete.bind(this)
        this.swap = this.swap.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.addNewCategory = this.addNewCategory.bind(this)
    }

    sendToDB(info) {
        fetch(`/settings`, {
            method: 'PUT',
            body: JSON.stringify({
                info: info
            })
        })
        .then(response => response.json())
        .then(json => {
            if (json['success'] == false) {
                console.log(`Error sending to DB: todo: ${info['todo']}, category: ${info['category']}, order: ${info['order']}, error: ${json['error']}`);
            }
        })
    }

    swap(lst, index1, index2) {
        // update state
        [lst[index1], lst[index2]] = [lst[index2], lst[index1]]
        this.setState({
            categories: lst
        })

        // send new order to DB for swapped categories
        this.sendToDB({
            'todo': 'reorder', 
            'category': lst[index1], 
            'order': index1
        })
        this.sendToDB({
            'todo': 'reorder', 
            'category': lst[index2], 
            'order': index2
        })
    }

    moveUp(event) {
        const lst = this.state.categories
        const category = event.target.id
        const old_index = lst.indexOf(category)

        if (old_index > 0) {
            this.swap(lst, old_index, old_index - 1)
        }
    }

    moveDown() {
        const lst = this.state.categories
        const category = event.target.id
        const old_index = lst.indexOf(category)

        if (old_index < lst.length - 1) {
            this.swap(lst, old_index, old_index + 1)
        }
    }

    edit() {
        this.setState({
            category_to_edit: event.target.id,
            edited_name: event.target.id
        })
        $('#editModal').modal('show');
    }

    saveEdits() {
        const new_categories = this.state.categories
        new_categories[this.state.categories.indexOf(this.state.category_to_edit)] = this.state.edited_name

        this.setState({
            categories: new_categories
        })

        this.sendToDB({
            'todo': 'rename', 
            'category': this.state.category_to_edit,
            'edited_name': this.state.edited_name
        })
    }

    confirmDelete() {
        this.setState({category_to_edit: event.target.id})
        $('#deleteModal').modal('show');
    }

    delete() {
        const category = this.state.category_to_edit
        const new_categories = this.state.categories
        new_categories.splice(this.state.categories.indexOf(category), 1)
        this.setState({
            categories: new_categories
        })

        this.sendToDB({
            'todo': 'delete',
            'category': category
        })
    }

    handleChange() {
        const id = event.target.id
        const val = event.target.value
        this.setState({[id]: val})
    }

    addNewCategory() {
        event.preventDefault()
        const category = this.state.new_category
        const new_categories = this.state.categories
        
        if (!(this.state.categories.includes(category)) && category != '') {
            new_categories.push(category)
            this.setState({
                new_category: '',
                categories: new_categories    
            })
            this.sendToDB({
                'todo': 'add', 
                'category': category
            })
        }
    }

    render() {
        const category_rows = []
        for (let category of this.state.categories) { 
            category_rows.push(
                <tr key={category}>
                    <td>{category}</td>
                    <td>
                        <button onClick={this.moveUp} className='btn btn-link p-0 m-0'>
                            <img src={this.props.up_img} height="18" id={category}></img>
                        </button>
                        <button onClick={this.moveDown} className='btn btn-link p-0 m-0'>
                            <img src={this.props.down_img} height="18" id={category}></img>
                        </button>
                        <button onClick={this.edit} className='btn btn-link p-0 m-0'>
                            <img src={this.props.edit_img} height="14" className='pl-2' id={category} style={{verticalAlign: "0px"}}></img>
                        </button>
                        <button onClick={this.confirmDelete} className='btn btn-link p-0 m-0'>
                            <img src={this.props.trash_img} height="14" className='pl-2' id={category} style={{verticalAlign: "0px"}}></img>
                        </button>
                    </td>
                </tr>
            )
        }

        {/* addd new category button  */}
        category_rows.push(
            <tr key='add_new'>
                <td>
                    <input className="form-control form-control-sm text-center" type="text" placeholder="New Category" value={this.state.new_category} onChange={this.handleChange} id='new_category'></input>
                </td>
                <td>
                    <button type="submit" className='btn btn-link m-0 p-0'>
                        <img src={this.props.add_img} height="20" width="20"></img>
                    </button>                    
                </td>                    
            </tr>
        )

        return (
            <div>
                <div className='row'>
                    <div className='col'></div>
                    <form onSubmit={this.addNewCategory}>
                        <table className='table table-hover table-sm col-auto' style={{width: 'auto'}}>
                            <tbody>
                                {category_rows}
                            </tbody>
                        </table>
                    </form>
                    <div className='col'></div>
                </div>

                {/* delete modal */}
                <div className="modal fade" id="deleteModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4>Delete Category</h4>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete the category {this.state.category_to_edit}?
                            </div>  
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-info" data-dismiss="modal">
                                    <img src={this.props.close_img} height="20" width="20" style={{verticalAlign: "-5px"}} className='p-0 m-0'></img>
                                    <span>Cancel</span>
                                </button>
                                <button type="button" className="btn btn-outline-info" data-dismiss="modal" onClick={this.delete}>
                                    <img src={this.props.trash_img} height="15" width="15" style={{verticalAlign: "-1px"}} className='p-0 m-0'></img>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* edit modal */}
                <div className="modal fade" id="editModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4>Edit Category Name: {this.state.category_to_edit</h4>
                            </div>
                            <div className="modal-body">
                                <input className="form-control form-control-sm text-center" autoFocus type="text" value={this.state.edited_name} id='edited_name' onChange={this.handleChange}></input>
                            </div>  
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-info" data-dismiss="modal">
                                    <img src={this.props.close_img} height="20" width="20" style={{verticalAlign: "-5px"}} className='p-0 m-0'></img>
                                    <span>Cancel</span>
                                </button>
                                <button type="button" className="btn btn-outline-info" data-dismiss="modal" onClick={this.saveEdits}>
                                    <img src={this.props.check_img} height="20" width="20" style={{verticalAlign: "-5px"}} className='p-0 m-0'></img>
                                    <span>Save</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}