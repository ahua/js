var local = null;

var BookmarkInfo = {
		deletes:[],
		updates:[],
		latest_sid:0,
		ongoing:0,
		treeRoot:null
};

var BookmarkSyncCtrl = {
	timeIntervalId:null	
};

BookmarkSyncCtrl.sync = function(sid) {
	print_msg('[BookmarkSync] Start...');
	
	if(sid != null) {
		var sid_local = CommInfo.after_sid();
		if(sid_local.bookmark >= sid) {
			print_msg("[BookmarkSync] local sid is greater than push sid, no need to sync.");
			return;
		}	
	}
	
	//If there's no other sync process ongoing, start one. 
	if(BookmarkInfo.ongoing == 0) {
		//Check bookmark enable or not.
		var setting = CommInfo.get_setting();
		if(setting.bookmark) {
			BookmarkInfo.ongoing = 1;
			if(localStorage['DolphinBrowserBookmark'] == null) {
				//If this is the first time to sync, init local bookmark data.
				BookmarkSyncStorage.init(BookmarkSyncStorage.syncLocalPreprocess, SYNC_state);
			}
			else
			{
				BookmarkSyncStorage.syncLocalPreprocess(SYNC_state);
			}	
		}
	}	
};

BookmarkSyncCtrl.clear = function() {
	BookmarkInfo.deletes = [];
	BookmarkInfo.updates = [];
	BookmarkInfo.latest_sid = 0;
	BookmarkInfo.ongoing = 0;
	BookmarkInfo.treeRoot = null;
	local = null;
	merge_clear();
}