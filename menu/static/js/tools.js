function str_to_dict(str) {
    // return null if none
    if (str == 'None') {
        return null
    }

    // replace html characters
    let replaced = str.replace(/&quot;/g, '"')
    replaced = replaced.replace(/&#x27;/g, "'")
    
    // convert to json and return
    try {
        return JSON.parse(replaced)
    }
    catch(err) {
        console.log(`Error parsing: ${err}`)
        return null
    }
}

function is_mobile() {
    return window.matchMedia("only screen and (max-width: 760px)").matches
}