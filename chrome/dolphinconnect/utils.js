/*Google Analytics API*/
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-35178856-1']);
//_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


/* ba */
function setBelugaCode(user_id) {
    (function() {
	var ba = document.createElement('script'); ba.type = 'text/javascript';
	ba.src = chrome.extension.getURL('ba.js');
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ba, s);
    })();
    
    setTimeout(function(){
	var appinfo ={"app_key":"cf54c60ae3ed48b09a090498b07b580e","version":"0.1","chn":"chrome","uid":user_id, "target":"http://en.belugaboost.com"};
	_ba.setAppInfo(appinfo);	
    }, 1000);
}

function track_event(config, opt)
{
    var category = config.category;
    var action = config.action;
    var label = config.label;
    var value = config.value;
    
    try {
	if(opt == null) {
	    _gaq.push(['_trackEvent', 'chrome_en', action, label, value]);
	    if(_ba) {
		_ba.track('chrome_en', action, label, value);		
		if(action=='TabSync') {
		    _ba.track('sync', 'tabs', '', value);
		}
		else if(action =='BookmarkSync') {
		    _ba.track('sync', 'bookmarks', '', value);
		}						
	    }
	}
	else 
	{	
	    if(_ba) {
		_ba.track(category, action, label, value);		
	    }			
	}
    }
    catch(e) {
	console.log(e);
    }
}


function getQueryStringRegExp(url,name)
{
    var reg = new RegExp("(^|\\?|&)"+ name +"=([^&]*)(\\s|&|$)", "i");
    var url_decode = decodeURIComponent(url);
    
    var location_hash = url_decode.indexOf("#");
    if(location_hash > 0) {
    	url_decode = url_decode.substring(0,location_hash);
    }
     
    if (reg.test(url_decode))
	{
		return unescape(RegExp.$2.replace(/\+/g, " ")); 
	}
	else
	{
		return "";
	}
};


function urlencode(params)
{
    if(typeof params == 'object')
    {
	var elements = new Array();
	
	for(var param in params)
	{
	    if (typeof params[param] == 'object')
	    {
		elements.push(param+"="+encodeURIComponent(JSON.stringify(params[param])));
	    }
	    else
	    {
		elements.push(param+"="+encodeURIComponent(params[param]));
	    }
	}
	
	return elements.join('&');		
    }
    else {
	return encodeURIComponent(params);
    }
}


function sendRequest(method, url, headers, body, callback, data,timeout_callback) {
    var xhr = new XMLHttpRequest();
    if(callback != null)
    {
	xhr.onreadystatechange = function() {
	    callback(xhr,data);
	}
    }
    
    xhr.open(method, url, true);
    if (headers) {
	for (var header in headers) {
	    if (headers.hasOwnProperty(header)) {
      		if(header == 'ClientVersion') {
      		    headers[header] = CommInfo.client_version;
      		}
		xhr.setRequestHeader(header, headers[header]);
	    }
	}
    }
    
    if(timeout_callback) {
  	xhr.timeout = 15*1000;
  	xhr.ontimeout = timeout_callback;
    }
    
    xhr.send(body);
    return xhr;
}


function showNotification(title,message)
{
}

function createNotification(title,message)
{
    var notification = webkitNotifications.createNotification(
	'images/normal.png',
	title,
	message
    );
    
    notification.ondisplay = function(event) {
    	setTimeout(function() {
            event.currentTarget.cancel();
        }, 
        	   3*1000);
    }
    
    notification.show();	
}


function get_clientid(flag)
{
    var _uuid = localStorage['DolphinBrowserClientId'];
    if(_uuid == null)
    {
	_uuid = uuid();
	localStorage['DolphinBrowserClientId'] = _uuid;
    }
    
    if(flag)
    {
	return _uuid + ":" + CommInfo.user_name;
    }
    else
    {
	return _uuid;
    }
}


function gen_devicename()
{	
    var devices = {'windows':'PC','mac':'Mac','linux':'Ubuntu','ubuntu':'Ubuntu'};
    var agt = window.navigator.userAgent.toLowerCase(); 
    var name = 'PC';
    
    for(var dev in devices)
    {
	if(agt.indexOf(dev) != -1)
	{
	    name = devices[dev];
	    break;
	}
    }
    
    var dev_prefix = ['Silver','Yellow', 'Gold', 'Red', 'Green', 'Blue', 'Purple', 'White', 'Black', 'Brown'];
    var buildin_dev_name = {};
    for(var idx in dev_prefix)
    {
	buildin_dev_name[dev_prefix[idx]+" "+name] = 0;
    }
    buildin_dev_name[name] = 0;
    
    var all_dev = CommInfo.device_list;
    if(all_dev == null || all_dev.length == 0){
	name = ''+name;
    }
    else{
	for(var id in all_dev) {
	    if(buildin_dev_name.hasOwnProperty(all_dev[id].deviceName)){
		delete buildin_dev_name[all_dev[id].deviceName];
	    }
	}
	
	var i=0;
	if(buildin_dev_name.hasOwnProperty(name)) {
	    name = name;
	}
	else {
	    for(i=0;i < dev_prefix.length; i++){
		if(buildin_dev_name.hasOwnProperty(dev_prefix[i]+" "+name)){
		    name=dev_prefix[i]+" "+name;
		    break;
		}
	    }
	}		
	save_devicename(name);
    }
    return name;
}

function get_devicename() {
    var dev_name = localStorage['DolphinBrowserDevName'];
    if(dev_name == null || dev_name == '') {
	return  '';
    }
    else {
	dev_name = JSON.parse(dev_name);
	if(dev_name[CommInfo.user_name] == null) {
	    return '';			
	}
	else{
	    return dev_name[CommInfo.user_name];
	}		
    }
}

function save_devicename(name) {
    var dev_name = localStorage['DolphinBrowserDevName'];
    if(!dev_name || dev_name.length == 0) {
	dev_name = {};
    }
    else{
	dev_name = JSON.parse(dev_name);
    }	
    
    dev_name[CommInfo.user_name] = name;
    localStorage['DolphinBrowserDevName'] = JSON.stringify(dev_name);
}

function get_os_type()
{
    var devices = {'windows':3,'mac':4,'linux':5,'ubuntu':5};
    var agt = window.navigator.userAgent.toLowerCase(); 
    var name = 'PC';
    
    for(var dev in devices)
    {
	if(agt.indexOf(dev) != -1)
	{
	    return devices[dev];
	}
    }
    
    return devices['windows'];
}


function get_utc()
{
	var now = new Date;
	var utc_timestamp = now.getTime();
	return utc_timestamp;
}


function getByteLength(str){
    if(str == null){
	return 0;	
    }
    return str.replace(/[^\x00-\xff]/g,"**").length;
}


function uuid(len,radix)
{
    var CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    var chars = CHARS,uuid = [],i;  
    radix = radix || chars.length;  
    
    if (len) {  
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];  
    } else {  
	// rfc4122 version 4 form  
      var r;  
	
      // rfc4122 requires these characters  
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";  
      uuid[14] = "4";  
  
      // Fill in random data.  At i==19 set the high bits of clock sequence as  
      // per rfc4122�� sec. 4.1.5  
      for (i = 0; i < 36; i++) {  
        if (!uuid[i]) {  
          r = 0 | Math.random()*16;  
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];  
        }  
      }  
    }  
    return uuid.join("");  
}  


function get_favico(url)
{
    var fav = 'chrome://favicon/' + url;
    return fav;
}


function set_push_history_num(num)
{
	chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
	chrome.browserAction.setBadgeText({text:num});
}


function removePush(data)
{
    if(data.type == 0)
    {
	var idx = data.value;
	
	var push_tabs = CommInfo.tab_push_list();
	push_tabs.splice(idx,1);
	CommInfo.save_push_tabs(push_tabs);
	
	var length = push_tabs.length;
	if(length > 0)
	{
	    set_push_history_num(""+length);
	}
	else
	{
	    set_push_history_num("");
	}
    }
    else
    {
	openAlltabs();
	CommInfo.save_push_tabs([]);		
	set_push_history_num("");
    }
}


function openAlltabs()
{
    var push_tabs = CommInfo.tab_push_list();
    for(var tab in push_tabs)
    {
	chrome.tabs.create({url:push_tabs[tab].url});
    }	
}


function set_sync_ico()
{
}


function set_normal_ico()
{
}




function focusWindow(id)
{
    if(id != null)
    {
	chrome.windows.update(id, {focused:true});
    }	
}


function init_setting()
{
    var client_id = localStorage['DolphinBrowserClientId'];
    if(client_id == null)
    {
	chrome.tabs.create({url:"http://www.dolphin-browser.com/help/extension.html"});
	get_clientid(false);
    }
}


function min(a, b) {
    return a < b? a: b;
}


function remove_device(dev_id)
{
    push_remove_device(dev_id+":"+CommInfo.user_name);
    remove_tab_sync_device(dev_id);
}


ext_debug = true;
function print_msg(msg)
{
    if(ext_debug){
	console.log(msg);
    }
}

init_setting();