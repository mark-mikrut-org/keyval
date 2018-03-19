// just in case there's some reason to go to a different server than
// the one that served up the host webpage, can change that address here
var base_url = '';

// some constants for stuff that someone might want to change
var SUCCESS = 1;
var FAIL = 0;
var RESULT = 'result';
var DATA = 'data';
var MESSAGE = 'message';

window.onload = init;

function init() {
    document.getElementById('loginButton').onclick = doLogin;
    document.getElementById('logoutButton').onclick = logout;
    document.getElementById('unsubscribeButton').onclick = unsubscribe;
    document.getElementById('signupButton').onclick = doSignup;
    document.getElementById('getAllButton').onclick = getAll;
    document.getElementById('deleteAllButton').onclick = deleteAll;
    document.getElementById('getButton').onclick = doGet;
    document.getElementById('setButton').onclick = doSet;
    document.getElementById('username').focus();
    document.getElementById('username').onkeypress = keyUsername;
    document.getElementById('thekey').onkeyup = checkGetSetButtons;
    document.getElementById('thekey').onkeypress = keyKey;
    document.getElementById('thevalue').onkeyup = checkGetSetButtons;
    document.getElementById('thevalue').onkeypress = keyValue;
    checkLogin();
}

// functions to update the DOM to reflect user status

function loggedIn(username) {
    var div = document.getElementById('status');
    div.innerHTML = 'Logged in as "' + username + '"';
    div.setAttribute('class', 'loggedin');
    document.getElementById('loggedout').hidden = true;
    document.getElementById('loggedin').hidden = false;
    document.getElementById('loginfields').hidden = true;
    document.getElementById('userinfo').hidden = false;
    document.getElementById('keyvalues').hidden = true;
    document.getElementById('thekey').focus();
}

function loggedOut(message) {
    var div = document.getElementById('status');
    var displayMessage = 'Logged Out'
    if (message) {
        displayMessage = message
    }
    div.innerHTML = displayMessage;
    div.setAttribute('class', 'loggedout');
    div = document.getElementById('keyvalues');
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
    document.getElementById('loggedout').hidden = false;
    document.getElementById('loggedin').hidden = true;
    document.getElementById('loginfields').hidden = false;
    document.getElementById('userinfo').hidden = true;
    document.getElementById('username').focus();
}

function signedUp(username) {
    var div = document.getElementById('status');
    div.innerHTML = 'Signed up as ' + username;
    div.setAttribute('class', 'loggedout');
}

function loginError(message) {
    var div = document.getElementById('errormessage');
    div.innerHTML = 'Error: ' + message;
    div.hidden = false;
}

function clearLoginError() {
    var div = document.getElementById('errormessage');
    div.innerHTML = '';
    div.hidden = true;
}

// is the user logged in?  A good thing to find
// out when the page loads.
function checkLogin() {
    var url = base_url + '/isloggedin';
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {            
            var result = JSON.parse(request.responseText);
            if (result[RESULT] == SUCCESS) {
                username = result[DATA]['username']
                if (username) {
                    loggedIn(username);
                } else {
                    loggedOut();
                }
            }
        }
    }
    request.send(null);
}

// handle keypress events for the key and value inputs, to provide
// short cuts for the user to just type and hit return

function keyKey(e) {
    if (e.keyCode == 13 && document.getElementById('thekey').value != '') {
        // they've entered a key and hit return -- assume they mean to do get
        doGet();
        document.getElementById('thekey').focus();
    }
}

function keyValue(e) {
    if (e.keyCode == 13 && document.getElementById('thekey').value != '' &&
        document.getElementById('thevalue').value != '') {
        // they've entered a key & value, and hit return in the value input
        // assume they mean to do  set
        doSet();
        document.getElementById('thekey').focus();
    }
}

// enabled or disable the get and set buttons
// depending on what's in the key and value inputs
function checkGetSetButtons() {
    var keyEl = document.getElementById('thekey');
    var valEl = document.getElementById('thevalue');
    
    if (keyEl.value != '') {
        if (valEl.value != '') {
            document.getElementById('setButton').hidden = false;
            document.getElementById('getButton').hidden = true;
        } else {
            document.getElementById('setButton').hidden = true;
            document.getElementById('getButton').hidden = false;
           
        }
    } else {
        document.getElementById('getButton').hidden = true;
        document.getElementById('setButton').hidden = true;
    }
}

// if user hits enter in the username field
// try to login -- shortcut
function keyUsername(e) {
    if (e.keyCode == 13) {
        doLogin();
    }

}

// doXXX  handler functions -- grab contents of input controls
// and call helper functions to do the work

function doLogin() {
    var usernameEl = document.getElementById('username');
    var username = usernameEl.value;
    login(username);
    usernameEl.value = '';
}

function doGet() {
    var keyEl = document.getElementById('thekey');
    var key = keyEl.value;
    get(key);
    keyEl.value = '';
    checkGetSetButtons();
}

function doSet() {
    var keyEl = document.getElementById('thekey');
    var key = keyEl.value;
    var valueEl = document.getElementById('thevalue');
    var value = valueEl.value;
    set(key, value);
    keyEl.value = '';
    valueEl.value = '';
    checkGetSetButtons();
}


function doSignup() {
    var usernameEl = document.getElementById('username');
    var username = usernameEl.value;
    signup(username);
    usernameEl.value = '';
}


// helper functions for each action the server provides

function logout() {
    var url = base_url + '/logout';
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {
            var result = JSON.parse(request.responseText);
            loggedOut();
        }
    }
    request.send(null);

}

function login(username) {
    var url = base_url + '/login?username=' + username;
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {            
            var result = JSON.parse(request.responseText);
            if (result[RESULT] == SUCCESS) {
                clearLoginError();
                loggedIn(username);
            } else {
                var message = result[MESSAGE];
                loginError(message);
            }
        }
    }
    request.send(null);
    
}
function signup(username) {
    var url = base_url + '/signup?username=' + username;
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {            
            var result = JSON.parse(request.responseText);
            if (result[RESULT] == SUCCESS) {
                clearLoginError();
                signedUp(username);
            } else {
                var message = result[MESSAGE];
                loginError(message);
            }
        }
    }
    request.send(null);
    
}

function unsubscribe() {
    var url = base_url + '/unsubscribe';
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {
            var result = JSON.parse(request.responseText);
            loggedOut('Unsubscribed');
        }
    }
    request.send(null);

}

function get(key) {
    var url = base_url + '/get?key=' + key;
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {            
            var result = JSON.parse(request.responseText);
            if (result[RESULT] == SUCCESS) {
                var rows = result.data;

                var div = document.getElementById('keyvalues');
                div.hidden = false;
                clearChildren(div);
                createKeyValues(rows, div);
            }
        }
    }
    request.send(null);
    
}

function set(key, value) {
    var url = base_url + '/set?key=' + key + '&value=' + value;
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {            
            var result = JSON.parse(request.responseText);
            if (result[RESULT] == SUCCESS) {
                getAll();
            }
        }
    }
    request.send(null);
    
}

function getAll() {
    var url = base_url + '/getall';
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {
            var result = JSON.parse(request.responseText);
            var rows = result.data;
            var div = document.getElementById('keyvalues');
            div.hidden = false;
            clearChildren(div);
            createKeyValues(rows, div);
        }
    }
    request.send(null);
}

function deleteAll() {
    var url = base_url + '/delete';
    var request = new XMLHttpRequest();
    request.open('GET', url);

    request.onload = function() {
        if (request.status == 200) {
            var result = JSON.parse(request.responseText);
            if (result[RESULT] == SUCCESS) {
                var div = document.getElementById('keyvalues');
                div.hidden = true;
                clearChildren(div);
                    
            }
        }
    }
    request.send(null);
}


// helpers to helper functions, to keep from
// repeating this code all over the place

function clearChildren(div) {
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

function createKeyValues(rows, element) {
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var key = row['key'];
        var value = row['value'];
        var innerDiv = document.createElement('div');
        innerDiv.setAttribute('class', 'keyvalue');
        innerDiv.innerHTML = key + ' = ' + value;
        element.appendChild(innerDiv);
    }
}
