//sync font end
SyncFontEnd = function(){
    this.init();
}
SyncFontEnd.prototype = {
    init:function(){
	var self = this,
	pageKind = document.body.id, //body id 指示当前显示页面
	comMatch={login:'loginInit',mainPane:'mainPaneInit',set:'setPaneInit'};//各页面初始化函数
	self.bg = chrome.extension&&chrome.extension.getBackgroundPage&&chrome.extension.getBackgroundPage();
	self.addEvent(window,'selectstart',function(e){e.preventDefault();return false;});//禁止滑选
	if(pageKind){self[comMatch[pageKind]]();}
	else{self.mainPaneInit();}
    },
    loginInit:function(){  //登陆处理逻辑

    },
    mainPaneInit:function(){  //主面板处理逻辑
	//if(!this.bg.CommInfo.is_login){chrome.browserAction.setPopup({popup:'login.html'});window.location.href="login.html";return ;}
	var self = this,curPage,syncLastOpen,mainHolder,syncList,outerHolder,enableViewOther=false;
	if(self.bg.CommInfo.is_login){
	    self.bg.CommInfo.popup_id = self;
	}
	if(!window.navigator.onLine){
	    self.$('mainPaneOuter').className+=' noNet';
	    self.$('mainPaneOuter').setAttribute('type','');
	    self.$('pageHolder').innerHTML = '<span><p>Network Error!</p>Please check your connection.</span>';
	    return ;
	}
	addListen();
	self.reflashPage = function(devices,shortCut,kind){
	    switch(kind){
	    case 'push':
		if(curPage=='device'){
		    createPageDom(devices,shortCut,'device');
		}
		break;
	    case 'sync':
		if(curPage=='sync'){
		    createPageDom(devices,null,'sync');
		}
		break;
	    }
	    return ;
	}
	function addListen(){
	    if(!(mainHolder=self.$('pageHolder'))){window.setTimeout(addListen,500);return ;}
	    outerHolder = self.$('mainPaneOuter');
	    self.addEvent(outerHolder,'click',function(e){handleClick(e)}); //委托所有click事件
	    curPage = 'device'; //当前所在页面 device sync
	    syncLastOpen=0; //记录tab 上一次展开位置 默认为第一个
	    //self.$('showUserInfo').innerHTML = self.bg.CommInfo.nick_name;  //主面析显示用户名
	    createPageDom(self.bg.CommInfo.device_list,self.bg.CommInfo.get_device_shortcut(),'device');
	    self.addEvent(window,'unload',function(){self.bg.CommInfo.popup_id = null;});	//关闭主面板时清空后台调用前端的接口
	    //加载时viewOther 默认不可点
	}
	function secAddListen(){  //获取sync 大标题结点，用于只显示一下展开
	    if(!(syncList=document.querySelectorAll('.syncListItem'))){window.setTimeout(secAddListen,500);return ;}
	}
	function createPageDom(data,shortCut,kind){  //组织页面之前的判断
	    outerHolder.setAttribute('type',((kind=='device')?'showDevice':'showSync'));
	    if(kind=='sync'){
		var tmpLocal = self.bg.CommInfo.get_setting(); //获取设置
		curPage = 'sync';
		if(tmpLocal){  //判断是否允许打开tab
		    if(!tmpLocal['tab']){showErr('syncOpps');return ;}
		}
		if(data&&data.length>0){hasDeviceTreat(data,shortCut,false);return;} //有数据正常显示 
		showErr('syncNoDevice'); //无数据显示没有设备
	    }else{ 
		curPage = 'device';
		if(self.bg.pusher != null&&self.bg.pusher.isConnect() == true){  //判断是否已连接 没有的话保持正在加载
		    chrome.tabs.query({highlighted:true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function(tabs){  //判断是否是无意义的tab
			tab = tabs[0];
			if((tab && (tab.url.indexOf("http://") == -1 && tab.url.indexOf("https://") == -1))){
			    viewOtherTreat(true);
			    showErr('sentEmpty');  //只能本地打开 不可发送
			}else{
			    if(data&&data.length>0){viewOtherTreat(true);hasDeviceTreat(data,shortCut,true);return;}  //正常显示
			    showErr('downDolphin');  //无设备 显示下载海豚 可发送
			}
		    });	
		}else{
		    mainHolder.className="loadDevice";  //正在加载样式
		    mainHolder.innerHTML="<span></span>";
		    mainHolder.style.overflowY='auto';
		    self.bg.pushReConnect();
		}
	    }
	}
	function hasDeviceTreat(data,shortCutList,isDevice){ 
	    var tmpHtml=[],tmpList=[],tmp,Width=[250,200,170,145,110];
	    if(isDevice){  //组织 device 
		for(var i=0,len = data.length;i<len;i++){ // 每一项
		    tmp = data[i];
		    if(tmp){
			tmpHtml.push('<div class="deviceItem" id="'+tmp.did+'"><a class="deviceItemInner '+(tmp.category||"pc")+((i==len-1)?" noBorder":"")+'" id="'+tmp.did+'">'+((shortCutList&&shortCutList[tmp.did])?'<span class="deviceName" style="width:'+Width[(shortCutList[tmp.did].length-1)]+'px">Send to '+(tmp.deviceName||'Siliver Pc')+'</span><span class="deviceShorcut">'+shortCutList[tmp.did].join('+'):'<span class="deviceName">Send to '+(tmp.deviceName||'Siliver Pc')+'</span><span class="deviceShorcut">')+'</span></a></div>')
		    }else{continue};
		}
		if(len>5){  //使用了margin-bottom 总是出现滑动条 用逻辑判断，多于5条设置scroll
		    mainHolder.style.overflowY='scroll';
		}else{
		    mainHolder.style.overflowY='hidden';
		}
		mainHolder.className = "deviceList";
	    }else{
		for(var i=0,j,secLen,len=data.length;i<len;i++){ //组织sync list
		    tmp = data[i].data;
		    secLen = tmp.data.length;
		    for(j=0;j<secLen;j++){ //收起来内容
			tmpList.push('<a class="itemLink" href="'+tmp.data[j].url+'" target="_blank"><img src="'+self.bg.get_favico(tmp.data[j].url)+'"/>'+tmp.data[j].title+'</a>')
		    }
		    tmpHtml.push('<div class="syncListItem '+((i==syncLastOpen)?"open":"")+'" ><span class="itemTitle" id="'+i+'">'+(tmp.name||'Silver Pc')+'</span><span class="itemHolder">'+tmpList.join("")+'</span></div>');//可见标题
		    tmpList = [];
		}
		mainHolder.className = "syncList";
		mainHolder.style.overflowY='auto';
	    }
	    mainHolder.innerHTML = tmpHtml.join('');
	    if(curPage=='sync'){secAddListen();}//获取tab所有节点 在收缩展开时用到 
	}
	function showErr(tmpKind){
	    var tmpCss = {
		'downDolphin':['someError downNewerDolphin',"<img src='images/secode.png'/><span>Scan to get the latest Dolphin on your mobile. Or log in to Dolphin Connect to get started if you already have it.</span>"],  //下载海豚
		'syncNoDevice':['someError syncNoDevice','<span>No tabs open in other devices!</span>'], //没有可同步设备
		'syncOpps':['syncOops','<p>Oops!</p>Open Tabs sync has been disabled. Please enable it in <a id="gotoSet">Settings</a> and try again.'], //禁用tab 
		'sentEmpty':['someError pushEmpty','<span><span></span>Cannot push blank tab!</span>'] //不可发送网址
	    };
	    if(!(tmpKind in tmpCss)){return ;}
	    mainHolder.className = tmpCss[tmpKind][0];
	    mainHolder.innerHTML = tmpCss[tmpKind][1];
	    if(tmpKind=='downDolphin'){   //无设备显示下载海豚 viewOther 不可点击
		viewOtherTreat(false);
	    }
	    mainHolder.style.overflowY='hidden';
	}
	function viewOtherTreat(method){
	    enableViewOther = method; 
	    self.$('viewOther').className=(method?'buttonType viewOther':"buttonType viewOther disabled"); 
	}
	function handleClick(e){  //处理点击事件 主面板
	    var tmpNode = e.target;
	    if(tmpNode.id =='showUserInfo'||tmpNode.id=='gotoSet'){self.bg.open_userinfo_page();return ;}  //点击帐号 打开设置页面
	    switch(curPage){
	    case 'device':   
		if(tmpNode.id=="back"||tmpNode.id =='viewOther'){  //点击viewOther 
		    if(tmpNode.id=='viewOther'&&enableViewOther){createPageDom(self.bg.CommInfo.tab_sync_list_sorted(),null,'sync');}
		    return ;
		}
		if(/\bdeviceName\b|\bdeviceItemInner\b|\bdeviceShorcut\b|\bdeviceItem\b/.test(tmpNode.className)){
		    tmpNode = tmpNode.parentNode;
		    if(self.bg){window.close();self.bg.pushSend(tmpNode.id,null);}  //点击设备 发送
		}
		break;
	    case 'sync':
		if(tmpNode.id=="back"||tmpNode.id =='viewOther'){  //点击back
		    if(tmpNode.id=='back'){createPageDom(self.bg.CommInfo.device_list,self.bg.CommInfo.get_device_shortcut(),'device');}
		    return ;
		}
		if(tmpNode.className=='itemTitle'){  //在sync 点击展开 
		    if(syncLastOpen == tmpNode.id){
			syncList[syncLastOpen].className = 'syncListItem';
			syncLastOpen = -1;
			return ;
		    }
		    tmpNode.parentNode.className+=' open';
		    if(syncList[syncLastOpen]){syncList[syncLastOpen].className = 'syncListItem'};//之前展开的收缩
		    syncLastOpen = tmpNode.id;
		}
		break;
	    default:
		break;
	    }
	    
	    
	}
    },
    setPaneInit:function(){   //设置页面处理逻辑

    },
    reflashDeviceName:function(){},
    shortCutInit: function() { },
    reflashPage:function(){},
    addEvent:function(tDom,eType,Func,other){
	if(!(tDom&&eType&&Func)){
	    return null;
	}
	other = (other==undefined)?true:other;
	if(tDom.length>1){
	    for(var i=0,len=tDom.length;i<len;i++){
		tDom[i].addEventListener(eType,Func,other)
	    }
	    return ;
	}
	tDom.addEventListener(eType,Func,other);
    },
    close: function(){
	window.close();
    },
    $:function(id,kind){  //kind 用于自定义获取方法
	if(kind){return document[kind](id);}
	return (Object.prototype.toString.call(id)=='[objec Array]')?document.querySelectorAll(id.join(',')):((typeof id =='string')?document.getElementById(id):null);
    }
}
var demo = new SyncFontEnd();
