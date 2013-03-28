/*
	Sonarlogin module.This module has some functions as follows:
	1. Get a phrase from voice server;
	2. Wait for a connect from phone.
	
	After connect from phone, sonar login panel will be closed, and coming into main panel,
	then tab sync will be started and do some initialization of login.
	
*/

var SonarConnectInfo = {
	receiver:null,
	timeout_id:null,
	timeout:2*60*1000, //2min 
	display_word:function(){},
	display_error:function(){},
	win_close:function(){},
	request:null,
	type:0
};

var TIMEOUT_MSG = "Phrase expired";
var LOGIN_SUCCESS_MSG = "Login successful"; 

/*
	Create a instance of sonar push module.
*/
function sonar_init()
{
	/*
		if no sonar connect push receiver exists, create one.
	*/
	if(SonarConnectInfo.receiver == null)
	{
		var client_id = get_clientid(false);
		SonarConnectInfo.receiver = new SonarPusher({dev_id:client_id, handler:login_connect});
		SonarConnectInfo.receiver.login();
	}
	
	/*
		clear timeout for connect time expire.
	*/	
	if(SonarConnectInfo.timeout_id != null) {
		clearTimeout(SonarConnectInfo.timeout_id);	
		SonarConnectInfo.timeout_id = null;
	}
	
	/*
		when a get phrase request is ongoing, stop it.
	*/
	if(SonarConnectInfo.request != null)
	{
		
		SonarConnectInfo.request = null;
	}
}

/*
	Disconnect push module from server and free sonar pusher instance.
*/
function sonar_close()
{
	if(SonarConnectInfo.receiver != null)
	{
		SonarConnectInfo.receiver.disconnect();
		SonarConnectInfo.receiver = null;
	}
	if(SonarConnectInfo.timeout_id != null) {
		clearTimeout(SonarConnectInfo.timeout_id);
		SonarConnectInfo.timeout_id = null;
	}
	if(SonarConnectInfo.request != null) {
		SonarConnectInfo.request.abort();
		SonarConnectInfo.request = null;	
	}
}

/*
	Get a sonar phrase from server.
*/
function get_sonar_cmd(show_word,show_error,win_close,type)
{	
	sonar_init();
	checkGeolocationAPI();
	SonarConnectInfo.display_word = show_word;
	SonarConnectInfo.display_error = show_error;
	SonarConnectInfo.win_close = win_close;
	SonarConnectInfo.type = type;
}

/*
	Call Geolocation API get location information and call get phrase API. 
*/
function checkGeolocationAPI()
{
	if(navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(get_location,get_failed);
	}
	else
	{
		//navigator is supported by chrome,so there is no problem here
		//print_msg('Geo location is not supported');
	}
}

/*
	Get location failed
*/
function get_failed(code)
{
	get_location({coords:{latitude:0,longitude:0}});
}

/*
	Get latitude and longitude and send data to server
	Params:
		position:
*/
function get_location(position)
{
	var lat = position.coords.latitude;
	var lon = position.coords.longitude;
	var client_id = get_clientid(false);	
	
	var method = 'POST';
	var url = API.sonar_command;
	var headers = {"Content-Type":"application/json"};
	var body = "location=["+lon+","+lat+"]&client_id="+client_id+"&type="+SonarConnectInfo.type;
	var callback = CALLBACK_getword;
	
	SonarConnectInfo.request = sendRequest(method, url, headers, body, callback);
}

function get_command_resp_proc(msg)
{
	if (msg.status == 0)
	{
		CommInfo.sonar_cmd = msg.data.text;
		SonarConnectInfo.display_word(CommInfo.sonar_cmd);
		
		SonarConnectInfo.timeout_id = setTimeout(function(){
			SonarConnectInfo.display_word(TIMEOUT_MSG, true);
			},
			SonarConnectInfo.timeout
		);	
	}
	else
	{
		//where should have a error display, but in this version dont consider this condition.
		SonarConnectInfo.display_error();
		clearTimeout(SonarConnectInfo.timeout_id);
		//document.getElementById('voice_text').value = "service not available";
	}
}

function CALLBACK_getword(xhr)
{
	if (xhr.readyState == 4)
	{
		if(xhr.status === 200)
		{
			var resp = JSON.parse(xhr.responseText);
			get_command_resp_proc(resp);
		}
		else
		{
			clearTimeout(SonarConnectInfo.timeout_id);
			SonarConnectInfo.display_error();
			//document.getElementById('voice_text').value = "Status:"+client.status+"get command failed!";
		}
		SonarConnectInfo.request = null;
	}
}

function login_connect(resp)
{
	connect_success(resp);
	try {
		sonar_close();
		SonarConnectInfo.win_close();	
	}
	catch(e) {
		print_msg(e);
	}
	chrome.browserAction.setPopup({popup:'mainPane.html'}); 
	//setTimeout(function(){SonarConnectInfo.win_close();},3000);
	
	//if connect is success, then continue to sync.
	//tab_sync();
	////login_init();
        get_user_info();
}

function connect_success(resp)
{
	var login_type = resp.type;
		
	//save connect user info to common data structure.
	CommInfo.token = resp.token;
	CommInfo.user_name = resp.email;
	CommInfo.email = resp.email;
	CommInfo.nick_name = resp.nick_name;
	CommInfo.login_type = login_type;
	
	if(resp.region_domain != null) {
		CommInfo.region_domain = resp.region_domain;
	}
	if(resp.push_domain != null) {
		CommInfo.push_domain = resp.push_domain;	
	}
		
	CommInfo.is_login = true;
	
	/*
		when username passed from sonarlogin phone, it's like ray@gmail.com@goole,
		so, filter '@google' out.
	*/
	var tmp = CommInfo.user_name;
	var first_place = tmp.indexOf('@');
	var secnd_place = tmp.indexOf('@',first_place+1);
	if(secnd_place != -1)
	{
		var username = tmp.substring(0, secnd_place);
		CommInfo.user_name = username;
	}	
	
	/*
		if user nick_name is null or has no body, use user_name instand.
	*/
	if(CommInfo.nick_name == null || CommInfo.nick_name.length == 0)
	{
		CommInfo.nick_name = CommInfo.user_name;
	}
	
	if((typeof login_type) == 'string') {
		login_type = parseInt(login_type);
	}
	
	switch(login_type)
	{
		case 0: //dolphin
		{
			CommInfo.login_typeName = 'Dolphin';
		}
		break;
		case 1: //sinaweibo
		{
			CommInfo.login_typeName = 'Sinaweibo';
		}
		break;
		case 10://google
		{
			CommInfo.login_typeName = 'Google';
		}
		break;	
		case 11://facebook
		{
			CommInfo.login_typeName = 'Facebook';
		}
		break;
		default:
			CommInfo.login_typeName = 'Dolphin';				
	}
	
	chrome.tabs.query({highlighted:true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function(tabs){
		if(tabs.length > 0 && (tabs[0].url.indexOf('http://') == 0 || tabs[0].url.indexOf('http://') == 0))
		{
			chrome.tabs.executeScript(null, {code: INJECT_CODE.SONAR_LOGIN});
			chrome.tabs.executeScript(null, {file: "cs_overlayer.js"});
		}
		else
		{
			//createNotification('Login successful','Login successful');
		}
	});	
	
	print_msg("login success");
	//SonarConnectInfo.display_word(LOGIN_SUCCESS_MSG);
}
