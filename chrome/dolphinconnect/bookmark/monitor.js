chrome.bookmarks.onCreated.addListener(

	function(id, createInfo) {
		if(BookmarkInfo.ongoing == 0 && CommInfo.is_login) {
			//sync start
			print_msg("detect bookmark create.");
			BookmarkSyncCtrl.sync();
		}		
	}	
);

chrome.bookmarks.onChanged.addListener(
	function(id,changeInfo){
		if(BookmarkInfo.ongoing == 0 && CommInfo.is_login) {
			//sync start
			print_msg("detect bookmark change.");
			BookmarkSyncCtrl.sync();
		}	
	}
);

/*
	{
		'index':0,
		'oldindex':1,
		'oldParentId':"20",
		'parentId':"20"
	}
*/
chrome.bookmarks.onMoved.addListener(
	function(id, moveInfo) {
		if(BookmarkInfo.ongoing == 0 && CommInfo.is_login) {
			var bk_data = BookmarkSyncStorage.load();
			if(bk_data.hasOwnProperty(id))
			{
				if(moveInfo.oldParentId != moveInfo.parentId){
					bk_data[id].pid = moveInfo.parentId;
				}
				
				//mark it's parent to dirty and state to MOVE
				bk_data[moveInfo.parentId].dirty=1;
				bk_data[id].state = BookmarkSyncState.MOVE;
				
				BookmarkSyncStorage.save(bk_data);
				print_msg('move bookmarks'+id);
			}
			//sync start
			print_msg("detect bookmark move.");
			BookmarkSyncCtrl.sync();
		}	
	}
);

chrome.bookmarks.onRemoved.addListener(
		function(id, removeInfo) {
			if(BookmarkInfo.ongoing == 0 && CommInfo.is_login) {
				//sync start
				print_msg("detect bookmark remove.");
				BookmarkSyncCtrl.sync();
			}				
		}
	);

/*
 	reorderInfo is a list of id of children.
 */
chrome.bookmarks.onChildrenReordered.addListener(
	function (id, reorderInfo) {
		if(BookmarkInfo.ongoing == 0 && CommInfo.is_login) {
			//sync start
			/*
			if(reorderInfo){
				var bk_data = BookmarkSyncStorage.load();
				bk_data[id].dirty = 2;
				BookmarkSyncStorage.save(bk_data);
				print_msg('children reorder bookmarks'+id);
				print_msg("detect bookmark children reorder.");
				BookmarkSyncCtrl.sync();
			}
			*/
		}	
	}	
);