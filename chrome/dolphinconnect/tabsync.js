function createTab(tabId, info, tab) {
	print_msg('detect create tab...');
	tabs_sync_process();
}

function updateTab(tabId, info, tab) {
	print_msg('detect update tab...');
	tabs_sync_process();
}

function removeTab(tabId, info, tab) {
	print_msg('detect remove tab...');
	tabs_sync_process();
}

/*
 *	tabs change listeners. 
 */
chrome.tabs.onCreated.addListener(createTab);
chrome.tabs.onUpdated.addListener(updateTab);
chrome.tabs.onRemoved.addListener(removeTab);

var tabs_sync = {
	last_tabs : {},
	timer_id:null,
	commit_delay:11*1000,
	setting:function (commit_delay) {
		tabs_sync.commit_delay = commit_delay;
	},
	clearTimer:function() {
		if(tabs_sync.timer_id != null) {
			clearTimeout(tabs_sync.timer_id);
		}
	}
}; 

/*
 *	Clear tab sync status. 
 */
function tabs_sync_clear() {
	tabs_sync.last_tabs = {};
	tabs_sync.clearTimer(); 
}

function tabs_sync_process() {
	if(CommInfo.is_login)
	{
		var setting_json = CommInfo.get_setting();
			
		if(setting_json.tab)
		{
			if(tabs_sync.timer_id == null){
				tabs_sync.timer_id = setTimeout(check_tabs_change, tabs_sync.commit_delay);		
			}	
		}
	}	
}

function check_tabs_change() {
	print_msg("start tab sync.");
	get_open_tabs();
}

//if user login ,then sync
function tab_sync_once(sid)
{
	print_msg("tab sync once start");
	
	if(sid != null) {
		var sid_local = CommInfo.after_sid();
		if(sid_local.tab >= sid) {
			print_msg("local is greater than push sid.");
			return;
		}	
	}
	
	if(CommInfo.is_login)
	{
		var setting_json = CommInfo.get_setting();
			
		if(setting_json.tab)
		{
			API_sync_state();
		}
	}		
}

//local sync tabs to server
function local_tab_sync()
{
	var tab_sync_id = localStorage["DolphinBrowserTabSyncId"];
	var tab_sync_id_json = null;
	if(tab_sync_id != null)
	{
		tab_sync_id_json = JSON.parse(tab_sync_id);
	}
	
	if(tab_sync_id_json == null || tab_sync_id_json[CommInfo.user_name] == null) //create
	{
		API_tab_sync_create();
	}
	else //update
	{
		API_tab_sync_update(tab_sync_id_json[CommInfo.user_name]);
	}
}

/*
	Get current open tab list.
*/
function get_open_tabs()
{
	if(tabs_sync.timer_id != null) {
		clearTimeout(tabs_sync.timer_id);
		tabs_sync.timer_id = null;		
	}
	
	var opentabs = CommInfo.cur_tab_list;
	var last_tabs = tabs_sync.last_tabs;
	var current_tabs = {};

	chrome.tabs.query({}, function (tabs) {
		var change = false;
		opentabs.splice(0,opentabs.length);
		for(var i in tabs)
		{
			//Must apply encodeURIComponent on title and url, otherwise error may occur.
			//if(tabs[i].url == '' || tabs[i].url == 'chrome://newtab/')
			//the url start with http or https can sync, otherwise the url will be filtered out
			if(tabs[i].url.indexOf('http://') == 0 || tabs[i].url.indexOf('https://') == 0)
			{

				if(current_tabs.hasOwnProperty(tabs[i].url)) {
					current_tabs[tabs[i].url] += 1;					
				}
				else
				{
					current_tabs[tabs[i].url] = 1;
				}
				opentabs.push({"title":tabs[i].title,"url":tabs[i].url});
			}
		}
		print_msg("list1");
		print_msg(JSON.stringify(current_tabs));
		print_msg("list2");
		print_msg(JSON.stringify(last_tabs));
		
		for(var url in current_tabs) {
			if(!last_tabs.hasOwnProperty(url)) {
				change = true;
				break;
			}
			else if(last_tabs[url] != current_tabs[url]){
				change = true;
				break;
			}
			delete last_tabs[url];
		}
		
		//if tabs has changes, then start sync process.
		if(change) {
			print_msg("tab sync changed and start local tab sync[1]");
			tabs_sync.last_tabs = current_tabs;
			track_event({
				category:'general',
				action:'TabSync',
				label:'trigger',
				value:1
			});				
			local_tab_sync();
		}
		else {
			var len = 0;
			for(var i in last_tabs) {
				len += 1;
				break;
			}
			if(len > 0) {
				print_msg("tab sync changed and start local tab sync[2]");
				tabs_sync.last_tabs = current_tabs;
				track_event({
					category:'general',
					action:'TabSync',
					label:'trigger',
					value:1
				});		
				local_tab_sync();
			}
			else {
				tabs_sync.last_tabs = current_tabs;
			}
		}
	});
}

/*
	Open/close tab sync.
*/
function sync_control()
{
	var setting_json = CommInfo.get_setting();
	if(setting_json.tab)
	{
		tab_sync_once();
	}
	
	if(setting_json.bookmark)
	{
		BookmarkSyncCtrl.sync();
	}
}