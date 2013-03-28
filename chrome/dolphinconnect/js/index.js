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
	var self = this,navCss={sonar:'sl',account:'al',old:'topArea '},errorHTML={netOffline:'<div class="networkErr"><span class="errorInf">Due to network problems,temporarily can not receive instructions</span></div>'},mainHolder=this.$('pageHolder'),sonarLoginObj={},navBar = this.$('nav');
	//if(!navigator.onLine){showErr('netOffline');}
	self.addEvent(this.$('mainAreaOut'),'click',function(e){mainArea(e);});//监听主要交互区域点击
	function mainArea(e){
	    var targetNode = ((e.target.tagName.toLowerCase()=='b')?e.target.parentNode:e.target),tmpId = targetNode.id;
	    if(e.target.id=='backBtn'){
		mainHolder.innerHTML='<a class="faceBook" id="facebook">Connect with <b>Facebook</b></a><a class="loginBtn" id="google">Connect with <b>Google Account</b></a><a class="loginBtn" id="dolphinLogin">Connect with <b>Dolphin Account</b></a>';
		document.getElementById('mainAreaOut').className='switchArea';
		self.bg.track_event({category:'general',action:'login',label:'account',value:1});
	    }
	    if(!(/(\bfacebook\b)|(\bgoogle\b)|(\bdolphinLogin\b)/.test(tmpId))){return ;}//过滤非登陆帐号选择点击
	    if(tmpId == 'dolphinLogin'){
		document.getElementById('mainAreaOut').className+=' showBack';
		dolphinLogin();
		return ;
	    }
	    
	    self.bg.thirdParty_login(tmpId,window);
	}
	
	function dolphinLogin(){
	    mainHolder.innerHTML = '<div class="dolphinAccount" id="dolphinAccount"><span class="daLoginTit">Account Login</span><form><input type="text" regExp=""  name="email" class="accountInput" placeholder="Email"/><input type="password" regExp="" name="password" class="accountInput"  id="firePw"placeholder="Password"/><a class="accountLoginBtn" id="loginBtn">Login</a></form><span class="wrongPw" id="showLoginErr">Your passwords were wrong!</span><span class="wrongInfoStyle Email">Please input valid Email!</span><span class="wrongInfoStyle Password">Please input password!</span></div>';
	    pageAddEvent();
	    navBar.className = navBar.className+' dolphin';
	    function pageAddEvent(){  //添加页面内的各种提示
		var tmpPNode;
		if(!(tmpPNode=self.$('dolphinAccount'))){window.setTimeout(pageAddEvent,500);return ;}
		var inputs = tmpPNode.getElementsByTagName('input');
		self.addEvent(inputs,'keydown',function(e){if(e.keyCode==13){e.target.blur();if(tmpPNode.getAttribute('error')=='none'){if(this.name=='password'){startLogin(inputs[0].value,inputs[1].value);}else{inputs[1].focus();}}}});
		self.addEvent(inputs,'focus',function(){var curErr = tmpPNode.getAttribute('error');this.className+=' focus';this.setAttribute('oldHolder',this.getAttribute('placeholder'));this.setAttribute('placeholder','');if(this.name==curErr||curErr=='passworderror'){tmpPNode.setAttribute('error','none')}});//输入获取焦点，有对应输入框错误提示则消除 有错误密码提示 直接消除
		self.addEvent(inputs,'blur',function(){this.className="accountInput";this.setAttribute('placeholder',this.getAttribute('oldHolder'));if(this.name=='password'&&tmpPNode.getAttribute('error')=='email'){return;}if(this.getAttribute('type')=='password'){if((/[^\!\@\#\$\%\^\&\*\(\)_+-=\[\]\{\}\\;\|\':\",.<>\/?0-9a-zA-Z]/g.test(this.value))||this.value.length<6){tmpPNode.setAttribute('error',this.name);}else{tmpPNode.setAttribute('error','none')}}else if(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.value)){tmpPNode.setAttribute('error','none')}else{tmpPNode.setAttribute('error',this.name);}});//输入框失去焦点，检查是否合法，并显示对应提示，如果帐号输入已经提示错误，密码输入不进行错误检查
		self.addEvent(self.$('loginBtn'),'click',function(){if(tmpPNode.getAttribute('error')=='none'){if(inputs[0].value==''){tmpPNode.setAttribute('error','email');return;}if(inputs[1].value==''){tmpPNode.setAttribute('error','password');return;}startLogin(inputs[0].value,inputs[1].value);}}); //点击登陆 无错误发出 否则取消
		self.addEvent(self.$('.wrongInfoStyle','querySelectorAll'),'click',function(){if(this.className.indexOf('Email')!=-1){inputs[0].focus();}else{inputs[1].focus();}});//点击错误 进入对应输入框
		inputs[0].focus();
	    }
	    function startLogin(userName,userPw){  //开始登陆
		if(!self.bg){window.console.log('dolphin login start');return ;}
		showloging(true);
		self.bg.dolphin_login(userName,userPw,showloging,loginFail,window);
		function loginFail(failText){  //失败 显示对应提示
		    if(!self.$('dolphinAccount')){return;}
		    showloging(false);
		    self.$('dolphinAccount').setAttribute('error','passworderror');;
		    if(failText){self.$('showLoginErr').innerHTML =failText; }
		}
		window.console.log(userName+userPw);
	    }
	} 
	function showloging(method){ //正在登陆 遮罩
	    if(method){self.dolphinLoging=true;self.$('loadCover').style.display ='block';}
	    else{self.dolphinLoging=false;self.$('loadCover').style.display ='none';}
	} 
	function showErr(kind){  //kind include netoffline,dolphinLoginWrongPw=> dlWrongPw,thirdLoginFail,sonarLoginFail,
	    mainHolder.innerHTML=errorHTML[kind];
	}
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
	var self=this,outerHolder,ShortCutList={},currentInput=null,trackCode={bookmark:['bookmarkson','bookmarksoff'],tab:['tabson','tabsoff'],dolphinBtn:['dolphinbutton','dolphinbutton'],pcName:'namechange',shortCut:'shortcutset'};
	addListen();
	function addListen(){  //监听事件
	    if(!(mainHolder=self.$('setOuter'))){window.setTimeout(addListen,500);return ;}// 判断页面是否加载完成
	    self.reflashDeviceName=function(tmpName){
		self.$('pcName').value = tmpName;
	    }
	    self.shortCutInit = function() {
                var self = this, data = self.bg.CommInfo.device_list, tmpShortCutList = (self.bg.CommInfo.get_device_shortcut && self.bg.CommInfo.get_device_shortcut());
                ShortCutList ={};
		if (data.length > 0) {
                    var tmpNode = self.$('shortCutHolder'), tmpHtml = [], tmpKeys;
                    tmpHtml.push('<span class="helpInfo">Click the box below to edit your shortcut</span>');
                    for (var i = 0, len = data.length; i < len; i++) {
                        tmpKeys = (tmpShortCutList && tmpShortCutList[data[i].did]) ? (tmpShortCutList[data[i].did].join('+')) : "";
                        ShortCutList[data[i].did] = tmpKeys;  //保存已经用快捷键 控制重复
                        tmpHtml.push('<div class="shortCutItem ' + data[i].category + '"><span class="deviceName">' + (data[i].deviceName && data[i].deviceName.replace(/%20/, ' ')) + '</span><span class="shortCutKeys" id="' + data[i].did + '">' + tmpKeys + '</span><span class="deleBtn"></span></div>');
                    }
                    tmpNode.innerHTML = tmpHtml.join('');
                } else {
                    var tmpNode = self.$('shortCutHolder');
                    tmpNode.innerHTML = '<div class="noDevice">No devices connected!</div>';
                }
            }
	    self.bg.CommInfo.infoPage_id = self;
	    self.addEvent(self.$('cancle'),'click',function(){comfirmBox(false)});  //logout 退出按键
	    self.addEvent(self.$('yes'),'click',function(){window.close();self.bg.logout();}) //logout 确定按键
	    self.addEvent(mainHolder,'click',function(e){handleClick(e)});
	    self.addEvent(document,'keydown',function(e){getKeys(e)}); //捕获用户按键
	    self.addEvent(self.$('pcName'),'focus',function(){if(this.parentNode.className.indexOf('reName')==-1){this.parentNode.className+=" reName";}this.setAttribute('oldvalue',this.value)}); //rename PC name 
	    self.addEvent(self.$('pcName'),'blur',function(){var tmpName = this.parentNode.className;this.parentNode.className=tmpName.replace(' reName','');if(this.value!=''&&self.bg.dev_rename){self.bg.dev_rename(null,this.value,null);self.bg.track_event({category:'general',action:'setting',label:trackCode['pcName'],value:1});}else{this.value=this.getAttribute('oldvalue')};});
	    self.addEvent(window,'unload',function(){self.bg.CommInfo.infoPage_id = null;saveSetting('both')}); //退出时再保存一次
	    self.addEvent(self.$('gotoAdvance'),'click',gotoAdvance);
	    showSetInfo();  //显示帐号相关信息
	}
	function showSetInfo(){
	    var checkBoxs,localSetting;
	    self.$('nickName').innerHTML = self.bg.CommInfo.nick_name; // 显示 用户名
	    self.$('userName').innerHTML = self.bg.CommInfo.email||self.bg.CommInfo.user_name; //帐号 
	    self.$('accountKind').innerHTML = self.bg.CommInfo.login_typeName; //帐号类型
	    self.$('pcName').value = self.bg.get_devicename();  //当前设备名称
	    localSetting=self.bg.CommInfo.get_setting(); //获取本地缓存中的设置，
	    if(localSetting){   //显示check 设置
		checkBoxs = self.$('.formCheck','querySelectorAll');
		if(checkBoxs.length>=3){
		    if(localSetting['bookmark']){checkBoxs[0].className+=' checked';checkBoxs[0].childNodes[0].checked=true}
		    if(localSetting['tab']){checkBoxs[1].className+=' checked';checkBoxs[1].childNodes[0].checked=true}
		    if(localSetting['button']){checkBoxs[2].className+=' checked';checkBoxs[2].childNodes[0].checked=true}
		}
	    }
	    //设置快捷键之前状态
	    self.shortCutInit();
	}
	function saveSetting(kind){ //保存设置 用kind可分开保存 避免无用的保存
	    if(kind!='saveShort'){  //保存 本地设置
		var checkBoxs = self.$('.formCheck','querySelectorAll'),settings;
		settings = {bookmark:checkBoxs[0].childNodes[0].checked,tab:checkBoxs[1].childNodes[0].checked,button:checkBoxs[2].childNodes[0].checked}
		self.bg.CommInfo.save_setting(settings);
	    }
	    if(kind!='saveCheck'){ //保存快捷键
		var shortCutNList = self.$('.shortCutKeys','querySelectorAll'),tmpObj ={};
		for(i=0,len = shortCutNList.length;i<len;i++){
		    if(shortCutNList[i].className.indexOf('input')!=-1){continue;}
		    tmpObj[shortCutNList[i].id] = shortCutNList[i].innerHTML.split('+');
		}
		(self.bg.CommInfo.save_device_shortcut&&self.bg.CommInfo.save_device_shortcut(tmpObj));
	    }
	}
	function shortCutExitCurrent(){ //退出快捷键编辑状态
	    var tmpClass = currentInput.className;
	    currentInput.className=tmpClass.replace(' input','');
	    tmpClass=currentInput.parentNode.className;
	    currentInput.parentNode.className=tmpClass.replace(' inputState','');
	}
	function comfirmBox(isShow){  //logout 对话框
	    self.$('showCover').style.display=isShow?'block':'none';
	    self.$('showConfirm').style.display=isShow?'block':'none';
	}
	function handleClick(e){ //页面大部分点击逻辑控制
	    var tmpId = e.target.id,tmpN=e.target;
	    if(tmpId == 'logout'){ //点logout
		comfirmBox(true);
		return ;
	    }
	    if(tmpN.className=="deleBtn"){var tmpP = tmpN.previousSibling;tmpP.innerHTML='';ShortCutList[tmpP.id] = "";saveSetting('saveShort')}//点 小X
	    if(tmpN.className=='formCheck'){tmpN.className+=' checked';tmpN.childNodes[0].checked=true;saveSetting('saveCheck');self.bg.track_event({category:'general',action:'setting',label:trackCode[tmpN.childNodes[0].id][0],value:1});return ;}  //选择框加钩
	    if(tmpN.className=='formCheck checked'){tmpN.className = 'formCheck';tmpN.childNodes[0].checked=false;saveSetting('saveCheck');self.bg.track_event({category:'general',action:'setting',label:trackCode[tmpN.childNodes[0].id][1],value:1});return ;} //选择框去钩
	    if(tmpN.className=='shortCutKeys'){if(currentInput){shortCutExitCurrent();currentInput.innerHTML=currentInput.getAttribute('oldvalue');}tmpN.setAttribute('oldvalue',tmpN.innerHTML);tmpN.className+=' input';tmpN.parentNode.className+=' inputState';currentInput=tmpN;self.bg.track_event({category:'general',action:'setting',label:trackCode['shortCut'],value:1});return ;} //点击编辑快捷键
	    if(currentInput){shortCutExitCurrent();currentInput.innerHTML=currentInput.getAttribute('oldvalue');currentInput=null;}
	}
	function getKeys(e){
	    var keys = [],tmpShort;
	    if(e.target.id=='pcName'){  //pcName rename 回车退出
		if(e.keyCode==13){e.target.blur();}
		if(e.keyCode==8){return;}
		if(e.target.value.replace(/[^\x00-\xff]/g,"**").length>=20){e.preventDefault();}
		return ;
	    }
	    e.preventDefault();
	    if(!currentInput){return;} //无快捷键输入框选中退出
	    
	    if(e.ctrlKey || e.shiftKey || e.altKey||e.metaKey){ //有前缀键按下，显示 但不保存 无前缀键 不予响应
		if(e.metaKey){
		    keys.push('Cmd');
		}
		if(e.shiftKey) {
		    keys.push('Shift');
		}
		if(e.ctrlKey){
		    keys.push('Ctrl');
		}
		if(e.altKey) {
		    keys.push('Alt');
		}
		if(e.which){
		    keys.push(String.fromCharCode(e.which));
		}
		ShortCutList[currentInput.id] = "";
		keys = keys.join('+');
		tmpShort = JSON.stringify(ShortCutList);
		currentInput.innerHTML=keys;
		var tmpCode = e.keyCode;  //获取当前按下
		if((47<tmpCode&&tmpCode<58)||(64<tmpCode&&tmpCode<91)){ //当有非前缀键按下时判断是否重复 否保存 并退出编辑 是重复 提示重复 回复原值
		    if(tmpShort.indexOf('"'+keys+'"')==-1){	
			ShortCutList[currentInput.id]=keys;
			shortCutExitCurrent();
			currentInput.setAttribute('oldvalue',currentInput.innerHTML)
			currentInput = null;
			saveSetting('saveShort');
		    }else{
			alert('The shortcut has already existed, please choose another one.');
			var oldValue = currentInput.getAttribute('oldvalue');
			currentInput.innerHTML =oldValue;
			ShortCutList[currentInput.id]=oldValue;
		    }
		}
	    }
	}
	function gotoAdvance(){
	    var tempForm = document.createElement("form");    
	    
	    tempForm.id="tempForm1";    
	  
	    tempForm.method="post";    
	    var manage_domain = 'https://sen.dolphin-browser.com';
	    if(self.bg.CommInfo.region_domain != null) {
	  	manage_domain = self.bg.CommInfo.region_domain;
	    }
	    tempForm.action= manage_domain+'/manage';    
	    
	    tempForm.target='_blank';    
	    
	    
	    
	    var hideInput = document.createElement("input");    
	    
	    hideInput.type="hidden";    
	    
	    hideInput.name= "token";  
	    
	    hideInput.value = self.bg.CommInfo.token;
	    tempForm.appendChild(hideInput);     
	    
	    //tempForm.attachEvent("onsubmit",function(){ openWindow(name); });  
	    
	    document.body.appendChild(tempForm);     
	    
	    tempForm.submit();  
	    
	    document.body.removeChild(tempForm);  
	}
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
