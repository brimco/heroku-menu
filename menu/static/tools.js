function str_to_dict(str) {
    // return null if none
    if (str == 'None') {
        return null
    }

    // replace html characters
    let replaced = str.replace(/&quot;/g, '"')
    replaced = replaced.replace(/&#x27;/g, "'")
    
    // convert to json and return
    console.log('convert to json:')
    console.log(replaced)

    return JSON.load(replaced)
}

function is_mobile() {
    return window.matchMedia("only screen and (max-width: 760px)").matches
}