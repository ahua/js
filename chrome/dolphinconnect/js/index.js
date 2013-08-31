debug = true;
function debug_print(msg){
    if (debug){
	window.console.log(msg);
    }
}

bg = chrome.extension.getBackgroundPage();

function startLogin(){
    username = $("#username").val();
    passwd = $("#passwd").val();

    debug_print("start login: " + username + passwd);
    bg.dolphin_login(username, passwd, block, fail, window);
}

function block(msg){
    debug_print(msg);
}

function fail(msg){
    debug_print(msg);
}

$("#login").bind('click', startLogin);

