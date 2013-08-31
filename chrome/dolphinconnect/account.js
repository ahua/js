var dolphin_login_shade_handler;
var dolphin_login_error_handler;
var dolphin_loginwin;
var third_party_loginwin;

var tmp_user_name;
var tmp_password;
var dolphin_xhr = null;

function thirdParty_login(type, win)
{

}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(CommInfo.auth_tab_id != 'undefined' && 
       tabId == CommInfo.auth_tab_id && 
       changeInfo.url && 
       (changeInfo.url.substr(0, API.loginresult[0].length) == API.loginresult[0] ||
	changeInfo.url.substr(0, API.loginresult[1].length) == API.loginresult[1]))
    {
	var ret_url = changeInfo.url;
	var ret_st = getQueryStringRegExp(ret_url,"status");
	if(ret_st == '0')
	{
	    CommInfo.token = getQueryStringRegExp(ret_url,"token");
	    CommInfo.email = getQueryStringRegExp(ret_url,"email");
	    CommInfo.user_name = getQueryStringRegExp(ret_url,"user_name");
	    CommInfo.nick_name = getQueryStringRegExp(ret_url,"nick_name");
	    CommInfo.login_type = getQueryStringRegExp(ret_url,"type");
	    CommInfo.region_domain = null;
	    CommInfo.region_domain = getQueryStringRegExp(ret_url,"region_domain");
	    CommInfo.push_domain = null;
	    CommInfo.push_domain = getQueryStringRegExp(ret_url,"push_domain");
	    
	    if(CommInfo.login_type == '10')
	    {
		CommInfo.login_typeName = 'Google';
	    }
	    else if(CommInfo.login_type == '11')
	    {
		CommInfo.login_typeName = 'Facebook';			
	    }
	    else if(CommInfo.login_type == '1') {
		CommInfo.login_typeName = 'Sinaweibo';
	    }
			
	    CommInfo.is_login = true;
	    //close login window
	    try {
		chrome.tabs.remove(tabId);			
	    }
	    catch(e) {
		print_msg(e.message);
	    }
	    
	    //get_user_info();
	    if (CommInfo.nick_name == null || CommInfo.nick_name == '') {
		CommInfo.nick_name = CommInfo.email;
	    }
	    CommInfo.first_login = true;
	    CommInfo.is_login = true;
	    
	    login_init(CommInfo.lastTabId, true);
	    
	}
	else
	{
	    try {
		chrome.tabs.remove(tabId);			
	    }
	    catch(e) {
		print_msg(e.message);
	    }
	}
    }
});


function dolphin_login_cancel()
{
    if(dolphin_xhr) {
	try {
	    dolphin_xhr.abort();		
	}
	catch(e) {
	    print_msg(e.message);
	}
	dolphin_xhr = null;
    }
}



function get_user_info()
{
    var body;
    var method="POST";
    var url = API.info;
    var headers = {"Content-Type":"application/json"};
    if (parseInt(CommInfo.login_type) != 0)
    {
	body = {"token":CommInfo.token,"login_type":CommInfo.login_type};
    }
    else
    {
	body = {"token":CommInfo.token};
    }
    var body_encode = urlencode(body);
    sendRequest(method,url,headers,body_encode,get_user_info_result);
}

function get_user_info_result(xhr)
{
    if(xhr.readyState == 4)
    {
	var resp = JSON.parse(xhr.responseText);
	if(resp.status == 0) 	//connect success
	{	
	    CommInfo.user_name = resp.data.user_name;
            if(CommInfo.email == '') {
                CommInfo.email = CommInfo.user_name;        
            }
	    CommInfo.first_login = true;
            login_init();
	}
    }	
}

function dolphin_login(username, password, shade_ctrl, show_error, window)
{
    dolphin_login_shade_handler = shade_ctrl;
    dolphin_login_error_handler = show_error;
    dolphin_loginwin = window;
	
    var body={
	'user_name': username,
	'password': password,
	'client_id': get_clientid(false)
    };


    var headers = {"Content-Type":"application/json"};

    CommInfo.user_name = username;
    CommInfo.email = username;
    CommInfo.nick_name = username;
    
    sendRequest("POST",	API.auth, headers, urlencode(body),
		loginSuccess, null, function(){print_msg("timeout");});
}


function loginSuccess(xhr)
{
    if(xhr.readyState == 4){
	if(xhr.status == 200) {
	    var resp = null;
	    try {
		resp = JSON.parse(xhr.responseText);
	    }
	    catch(e) {
		print_msg(e.message);
		return;
	    }
	    
	    if(resp.status == 0){	
		CommInfo.token = resp.data.token;
		CommInfo.login_type = 0;
		CommInfo.is_login = true;
		CommInfo.login_typeName = 'Dolphin';
		CommInfo.region_domain = null;
		CommInfo.region_domain = resp.data.region_domain;
		CommInfo.push_domain = null;
		CommInfo.push_domain = resp.data.push_domain;
		
		if(dolphin_loginwin != null)
		{
		    
		    chrome.browserAction.setPopup({popup:'mainPane.html'}); 
		    dolphin_loginwin.close();
		}	
		login_init(null, true);
	    }
	}
    }
}				


function login_init(tabId, first_login){
    logout_failed_retry();
    
    CommInfo.device_list.splice(0,CommInfo.device_list.length);
    CommInfo.cur_tab_list.splice(0,CommInfo.cur_tab_list.length);
    
    save_user_login_info();
    
    if(CommInfo.user_id) {
    }
    else {
	API_validate_token();
    }
    
    push_init();
}

var logout_num = 0;

function logout(){
    logout_num = 0;
    var info = {
	token:CommInfo.token,
	dev_id:get_clientid(true)
    };
    
    localStorage['DolphinBrowserLogout'] = JSON.stringify(info);
    logout_api(info);
    logout_clear();
}



function logout_api(info)
{
    logout_num += 1;
    var method = "POST";
    var url = API.logout();
    var headers={"Content-Type":"application/json"};	
    var body={'token':info.token, "device_id":info.dev_id, "self_logout":1};
    var body_encode=urlencode(body);
    var callback = logout_callback;
    sendRequest(method, url, headers, body_encode, callback);
}

function logout_callback(xhr)
{
    if(xhr.readyState == 4)
    {
	if(xhr.status == 200) 
	{
	    logout_num = 0;
	    var resp = JSON.parse(xhr.responseText);
	    if(resp.status == 0)
	    {
		print_msg("logout success.");
	    }
	    else
	    {
		print_msg("logout failed.");
	    }
	    delete localStorage['DolphinBrowserLogout'];
	}
	else {
	    if(logout_num < 10) {
		setTimeout(logout_failed_retry, logout_num*1000);
	    }
	}
    }
}

function logout_failed_retry() {
    var info = localStorage['DolphinBrowserLogout'];
    if (info != null && info!= '') {
	var info_json = JSON.parse(info);
	logout_api(info_json);
    }	
}


function logout_clear()
{	
    push_close();
    tabs_sync_clear();
    
    if(CommInfo.popup_id != null) {
	try{
	    CommInfo.popup_id.close();		
	}
	catch(e) {
	    print_msg('close popup error');		
	}
	CommInfo.popup_id = null;
    }
    
    CommInfo.is_login=false;
    chrome.browserAction.setPopup({popup:'index.html'}); 
    CommInfo.device_list = [];
    removeall_menu();
    CommInfo.logining = false;
    CommInfo.sync_first = true;
    close_setting_page();	
    
    setTimeout(
    	function(){
	    delete localStorage['DolphinBrowserUserLoginInfo'];
	    delete localStorage['DolphinBrowserAfterSid'];
	    delete localStorage['DolphinBrowserAccountChange'];
	    delete localStorage['DolphinBrowserSyncTabs'];
	    delete localStorage['DolphinBrowserBookmark'];
	    delete localStorage['DolphinBrowserTabSyncId'];
	    delete localStorage['DolphinBrowserDevName'];
	    delete localStorage['DolphinBrowserPushShortcuts'];
	    delete localStorage['DolphinBrowserSetting'];
    	},
    	500
    );
}

function open_userinfo_page()
{
    chrome.tabs.query({url:chrome.extension.getURL('info.html')}, function(tabs){
	var len = tabs.length;
	
	if(len > 0)
	{
	    chrome.tabs.update(tabs[0].id, {active:true});
	}
	else
	{
	    chrome.tabs.create({url:'info.html'});
	}	
    });
}


function refresh_userinfo_page() {
    if(CommInfo.infoPage_id != null) {
	CommInfo.infoPage_id.shortCutInit();
    }
}

function close_setting_page()
{
    chrome.tabs.query({url:chrome.extension.getURL('info.html')}, function(tabs){
	if(tabs != null) {
	    for(var tab in tabs)
	    {
		chrome.tabs.remove(tabs[tab].id);
		print_msg("remove info.html"+tabs[tab].id);
	    }
	}	
    });
}


function save_user_login_info()
{
	var info = {
		token: CommInfo.token, 
		user_name:CommInfo.user_name, 
		nick_name:CommInfo.nick_name,
		email:CommInfo.email,
		login_type:CommInfo.login_type,
		login_typeName:CommInfo.login_typeName,
		region_domain:CommInfo.region_domain,
		push_domain:CommInfo.push_domain,
		user_id:CommInfo.user_id
	};
	localStorage['DolphinBrowserUserLoginInfo'] = JSON.stringify(info);
}


function check_login_status(){
    if(!CommInfo.is_login)
    {
	var user_login_info = localStorage['DolphinBrowserUserLoginInfo'];
	if(user_login_info != null && user_login_info != '')
	{
	    var login_info = JSON.parse(user_login_info);
	    check_last_login(login_info);
	    login_init();
	    chrome.browserAction.setPopup({popup:'mainPane.html'}) 
	}
    }
}


function check_last_login(login_info)
{
    CommInfo.user_name = login_info.user_name;
    CommInfo.nick_name = login_info.nick_name;
    CommInfo.email = login_info.email;
    CommInfo.token = login_info.token;
    CommInfo.login_type = login_info.login_type;
    CommInfo.login_typeName = login_info.login_typeName;
    CommInfo.is_login = true;
    CommInfo.sync_first  =true;	
    CommInfo.region_domain = login_info.region_domain;
    CommInfo.push_domain = login_info.push_domain;
    CommInfo.user_id = login_info.user_id;
}


chrome.browserAction.onClicked.addListener(function(tab) {
    CommInfo.lastTabId = tab.id; 
    focusWindow(CommInfo.login_win_id);
});	

