(function(global, undefined){

    var urlReg = /^(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
    var readyReg = /complete|loaded|interactive/;
    var _guid = (function (){
        var time = "qt_"+(new Date()).getTime(), i=0;
        return function(){
            return time + (i++);
        }
    })();

    // data: 参数为json对象，key：value形式
    function _tracker(url, data){
        var uid = _guid();
        var img = global[uid] = new Image();
        var params = [];
        for (var  key in data) {
            if (data.hasOwnProperty(key)) {
                var item = data[key];
                params.push(key+"="+encodeURIComponent(item));
            }
        }
        if(!urlReg.test(url)){
            throw new TypeError("请传入正确的url地址");
        }
        if( params.length<1){
            // 没有任何参数要上传
            return;
        }
        img.onload = img.onerror = function(){
            // 垃圾回收
            img.onload = img.onerror = null;
            img = null;
            global[uid] = null;
        }
        img.src = url + (url.indexOf('?') < 0 ? '?' : '&') + params.join('&');
    }

    function _getCookie(name) {
	    var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"), val = document.cookie.match(reg);
	    return val ? (val[2] ? decodeURIComponent(val[2]) : "") : null;
    }
    
    // 合并对象, 返回合并后的对象
    function _merge(base, extend) {
        var result = {};
        for (var key in base) {
            if (base.hasOwnProperty(key)) {
                result[key] = base[key];                
            }
        }
        for (var key in extend) {
            if (extend.hasOwnProperty(key)) {
                result[key] = extend[key];                
            }
        }
        return result;
    }

    // 获取元素的指定属性，以对象形式返回
    // function _getSpecDataSet(element, propNames){
    //     var res = {};
    //     if(propNames.length>0){
    //         for (var index = 0; index < propNames.length; index++) {
    //             var item = propNames[index];
    //             res[item] = element.getAttribute("data-"+item);
    //         }
    //     }
    //     return res;
    // }

    function _init(config, initData){
        /* 
            1. 默认上报页面上所有qtTrackerClass类的click事件，qtTrackerClass类可以自定义
            2. 默认去data-qtTracker上的对象上报， qtTracker属性名可自定义
            3. 默认统计userAgent, referrer 
        */
        var config = _merge({qtTrackerClass:".qt-tracker", trackPropName: "qt-tracker", isNeedClientInfo: true, eventName: "click"}, config);
        var initParmas = initData || {};
        var extraParmas = {guid: _guid()}; // 对初始化和事件统计都会加上的额外参数, guid类似加了版本号， 这样请求就不会缓存

        if(config.isNeedClientInfo){
            extraParmas.ua = navigator.userAgent;
            extraParmas.referrer = document.referrer;
        }
        // config.extra对所有统计都会有的附加数据是一个json对象
        extraParmas = _merge(extraParmas,config.extra);
        
        _ready(function(){
            var url = config.url, eventName = config.eventName;
            // 统计pv，uv
            _tracker(url, _merge(initParmas, extraParmas));

            // 统计事件
            var trackerElements = document.querySelectorAll(config.qtTrackerClass);
            if(trackerElements.length<1){
                return;
            }
            
            for (var index = 0, len = trackerElements.length; index < len; index++) {
                var element = trackerElements[index];
                // var props = _getSpecDataSet(element, config.trackPropName);
                var props = {}, prop = element.getAttribute("data-"+config.trackPropName);
                try{
                    props = JSON.parse(prop);
                }
                catch(ex){
                    props.qtTracker = prop;
                }
                // 把元素中需要上报的数据都附加到newRes中
                var newRes = _merge(extraParmas, props);
                (function(newRes){
                    _on(element, eventName, function(){
                        _tracker(url, newRes);
                    });
                })(newRes);                
            }
        });
    }

    // document已经ready之后执行callback回调
    function _ready(callback){
        if (readyReg.test(document.readyState) && document.body) callback()
        else document.addEventListener('DOMContentLoaded', function(){ callback() }, false)
    }

    // 事件绑定
    function _on(element, eventName, callback){
        if(!element || !eventName || typeof callback !== "function"){
            return;
        }
        if (element.addEventListener) {
            element.addEventListener(eventName, callback, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, callback);
        }
    }

    var qtTracker = {
        init: _init,
        tracker: _tracker
    };

    // umd方式支持主流cmd，amd，全局导出方式
    if ( typeof module === "object" && typeof module.exports === "object" ) {
        module.exports.qtTracker = qtTracker;
    }
    else if(typeof define === 'function' && define.amd){
        define(function() { return qtTracker; })
    }
    else{
        global.qtTracker = qtTracker;
    }

})(window);