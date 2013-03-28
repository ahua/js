
var DOLPHIN_TRANS = function(){};

DOLPHIN_TRANS.prototype = 
{
		init : function()
		{
			var that=this;
			chrome.extension.sendMessage({type:'buttonsetting'}, function(resp){
				var show = resp;
				if(show) {
					that.create();
					window.addEventListener("message", function(event) {
					    // We only accept messages from ourselves
					    if (event.source != window)
					      return;
					    
					    var data = event.data;
					    if (data.type && (data.type == "dolphin_baidu")) {
					    	var share_link =  data.link;
					    	var dev_id = data.dev_id;
					    	
					    	//console.log("Content script received: " + share_link+" : " + dev_id);
					    	chrome.extension.sendMessage({type:'map',data:{url:share_link, title:"baidu map", dev_id:dev_id}}, function(resp) {
					    		if(resp && resp.status == 1) {
					    			alert("Please log in Dolphin Connect extension.");
					    			return;
					    		}
					    		
					    		if(resp && resp.status == 2) {
									alert("Please check 'Dolphin Button' in setting");
					    			return;
					    		}
					    	});
					      //port.postMessage(event.data.text);
					    }
					}, false);
					//console.log("baidu map create...");
				}
			});
		},
        create : function()
        {
             var extendsdiv = document.getElementById('MapInfoNav');
             if (extendsdiv != null) {
            	      	 
            	 //remove exist elements
            	 var dolphin_trans = document.getElementById('dolphin_trans'),tmpCssStyle;
            	 if(dolphin_trans) {
            		 dolphin_trans.parentNode.removeChild(dolphin_trans);
            	 }            	 
            	 else {
            		 //create script
                	 var script=document.createElement('script');
                	 var content='';
					 var icon_path = chrome.extension.getURL('images/sentBtn.png');
					 content +='var hideTimer;'
                	 content += 'function dolphin_trans(a){displayDolphinSubMenu("false");Share.getLink(function(share_link){window.postMessage({type: "dolphin_baidu", link: share_link, dev_id: a.id}, "*");});}';
                	 content += 'function displayDolphinSubMenu(isShow){ var tmp = document.getElementById("dolphin_deviceList");if(!tmp){return;}clearTimeout(hideTimer);tmp.style.display = (isShow=="true"?"block":"none");}';
					 content += 'function hideDolphinSubMenu(){hideTimer=setTimeout(function(){displayDolphinSubMenu("false")},500);}';
                	 content += 'function showDolphinSubMenu(){clearTimeout(hideTimer)}';
                	 script.innerText = content;
                	 document.getElementsByTagName('head')[0].appendChild(script);
                	 
                	 tmpCssStyle = "#dolphin_trans a{text-decoration: none;cursor:pointer;} #dolphin_trans{float: left;margin-top: 4px;height: 25px;}#dolphin_trans .dolphin_map_button{display: inline-block;height: 24px;width:76px;background:url("+icon_path+") no-repeat 0px -6px;background-size:262px;padding: 5px 0 5px 25px;font-size:12px;line-height:16px;font-family:'Microsoft yahei','微软雅黑','Tahoma','Verdana','Arial','sans-serif';color: #222;}#dolphin_trans .dolphin_map_button:hover{background-position:0 -87px}#dolphin_trans #dolphin_deviceList{width: 71px;overflow: hidden;-webkit-box-shadow: #CCC 0px 0px 8px;margin:-4px 0 0 2px}#dolphin_trans #dolphin_deviceList li a{display: block;height: 25px;width:100%;overflow:hidden;white-space: nowrap;text-overflow:ellipsis;background-color: #fff;line-height: 25px;text-align: center;color: #444444;font-size:12px;font-family:'Segoe UI Semibold',Segoe UI,Helvetica, Arial, sans-serif;}#dolphin_trans #dolphin_deviceList li a:active{background:#379c00 !important;color:#fff}#dolphin_trans #dolphin_deviceList li a:hover{background: #e5efe3;}#dolphin_trans #dolphin_deviceList li{border-bottom:1px solid #ccc;}#dolphin_trans #dolphin_deviceList li:active{border-color:#379c00 !important;}#dolphin_trans #dolphin_deviceList li:hover{border-color:#e5efe3;}#dolphin_trans #dolphin_deviceList li:last-child{border-bottom:none}";
            	 }             	 
            	 dolphin_trans = document.createElement('div');
            	 dolphin_trans.setAttribute("id", "dolphin_trans");

            	 // var dolphin_button = document.createElement('ul');
            	 // dolphin_button.setAttribute('id', 'dolphin_map_button');
            	 // dolphin_trans.appendChild(dolphin_button);
            	 
            	 // var dolphin_menu_layer = document.createElement('li');
            	 // dolphin_menu_layer.setAttribute('onmouseover', 'displayDolphinSubMenu(this)');
            	 // dolphin_menu_layer.setAttribute('onmouseout', 'hideDolphinSubMenu(this)');
            	 // dolphin_button.appendChild(dolphin_menu_layer);
            	 
            	 var dolphin_menu_top  = document.createElement('a');
				 dolphin_menu_top.setAttribute('onmouseover', 'displayDolphinSubMenu("true")');
				 dolphin_menu_top.setAttribute('onmouseout', 'hideDolphinSubMenu()');
				 dolphin_menu_top.setAttribute('class','dolphin_map_button');
				 dolphin_menu_top.innerHTML = '发至手机';
            	 dolphin_trans.appendChild(dolphin_menu_top);
            	 
            	 
            	 //request push device data
            	 chrome.extension.sendMessage({type:'dev_data'}, function(resp){
            		 devs = resp;
					 var style = document.createElement('style');
            		 if(devs.length > 1){
            			 var dolphin_menu_sec = document.createElement('ul');
						 style.innerHTML = tmpCssStyle;
						 document.getElementsByTagName('head')[0].appendChild(style);
						 dolphin_menu_sec.id = "dolphin_deviceList";
						 dolphin_menu_sec.setAttribute('onmouseout', 'hideDolphinSubMenu()');
						 dolphin_menu_sec.style.display ="none";
            			 dolphin_trans.appendChild(dolphin_menu_sec);
            			 
            			 //create device menu.
            			 for(var idx in devs) {
            				var li = document.createElement('li');
            				var a = document.createElement('a');
							li.setAttribute('onmouseover', 'showDolphinSubMenu()');
            				a.setAttribute('onclick', 'dolphin_trans(this)');
            				a.setAttribute('id', devs[idx].did);
							a.innerHTML = devs[idx].deviceName;
							//a.innerHTML = ((tmpName.length>8)?(tmpName.substring(0,6)+'…'):tmpName); 
            				li.appendChild(a);
            				dolphin_menu_sec.appendChild(li);
            			 }
						 extendsdiv.appendChild(dolphin_trans);
						 return ;
            		 }
            		 else if(devs.length == 1){
            			 dolphin_menu_top.setAttribute('id', devs[0].did);
            			 dolphin_menu_top.setAttribute('onclick', 'dolphin_trans(this)');
            		 }
            		 else if(devs.length == 0) {
            		 	 dolphin_menu_top.setAttribute('onclick', "alert(decodeURIComponent('%E8%AF%B7%E5%9C%A8%E6%96%B0%E7%89%88%E6%B5%B7%E8%B1%9A%E6%B5%8F%E8%A7%88%E5%99%A8%E4%B8%8A%E7%99%BB%E5%BD%95'));");
            		 }
					 tmpCssStyle+="#dolphin_trans .dolphin_map_button:active{background-position:0 -174px}";
					 style.innerHTML = tmpCssStyle;
					 document.getElementsByTagName('head')[0].appendChild(style);
            		 extendsdiv.appendChild(dolphin_trans);
            	 });
            	
             }
             
        }
};
var devs = null;
var overlay = new DOLPHIN_TRANS();
overlay.init();

