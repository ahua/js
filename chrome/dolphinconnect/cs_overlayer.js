
var DolphinShowInfo = function(){
	this.create();
};

DolphinShowInfo.prototype = 
{
        create : function()
        {
             var self=this,extendsdiv = document.getElementById('dolphinPushInfo'),icon_path = chrome.extension.getURL('images/ico.png'),tmpDiv,tmpState = window.DOLPHIN_STATUS,tmpCss=['dolphinSoundLogin','dolphinPushing','dolphinPushSuccess','dolphinPushSuccess','dolphinPushSuccess','dolphinPushSuccess','dolphinPushSuccess','dolphinPushFail','dolphinLoginSuccess','dolphinPushFail'],tmpText=['Login Successful','Sending…','Selected text sent successfully','Page sent successfully','Direction sent successfully','Image sent successfully','App sent successfully','Network error,send failed','Login Successful','Send failed!'];
             if(extendsdiv){var tmpP = extendsdiv.parentNode;tmpP.removeChild(extendsdiv);}
                var styles = '\
					.wzcsdiv_ld{display:inline-block !important;position:fixed;right:4px;top:4px; border: 1px solid #ccc;padding: 12px 31px 18px 67px; color:#555; background:url('+icon_path+') no-repeat #fff; border-radius:6px; box-shadow: 0 0 28px #ccc;font-weight:600;font-size:20px;font-family:"Segoe UI", Arial, "Microsoft Yahei", Simsun, sans-serif;z-index:9999999;}.dolphinLoginSuccess{background-position:16px -374px}.dolphinPushSuccess{background-position:16px 6px}.dolphinPushFail{background-position:16px -286px}.dolphinPushing{background-position:21px -187px}.dolphinSoundLogin{background-position:16px -88px},.hide{display:none}\
                	';
                
                // add overlay
				if(tmpState==undefined||!(/[0-9]/.test(tmpState))){return ;}
				tmpDiv = '<span id="sonar_login_success_overlay" class="wzcsdiv_ld '+tmpCss[tmpState]+'">'+tmpText[tmpState]+'</span>';
             
                // add to DOM
                var overlayFakeContainer = document.createElement('div');
                overlayFakeContainer.id = "dolphinPushInfo";
                overlayFakeContainer.innerHTML = '<style>'+styles+'</style>' + tmpDiv;
                document.body.appendChild(overlayFakeContainer);
                
            // animate in
            if(tmpState!=1){
				clearTimeout(this.hideTO);
				this.hideTO = setTimeout(function(){self.hide();}, 2500);
			}
        },
        hide : function()
        {
                var overlay = document.getElementById('dolphinPushInfo');
                overlay.style.visibility = 'hidden';
                overlay.parentNode.removeChild(overlay);
        }
};
var overlay = new DolphinShowInfo();