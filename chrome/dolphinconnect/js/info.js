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
