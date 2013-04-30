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
