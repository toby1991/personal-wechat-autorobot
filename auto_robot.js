/**
 * Created by Toby on 15/10/29.
 */
var webpage = require('webpage');
var page = webpage.create();
//var fs = require('fs');
//var system = require('system');

// 全局变量
var qrcode_path = '/wwwroot/xxx.com/public/img/Article/'; // the path to place login qrcode
var api_init_server = 'http://xxx.com/xxx/init-wechat-robot'; // init wechat boot url
var api_server = 'http://xxx.com/xxx/get-wechat-robot'; // get wechat robot task url
var api_logout_server = 'http://xxx.com/xxx/logout-wechat-robot'; // logout wechat robot url
var current_url = "https://wx.qq.com/";
var task = {
    username: '用户名',	// person to talk
    words:    '要说的话', // words
    send_time: '2015年10月30日 GMT+8 16:18:50', // task time
};
var auto_reply = ''; // auto reply word
var task_switch = false; // task switch
var auto_reply_switch = false; // auto reply switch

var is_reload = false; // 是否为刷新页面

var init = function(){
    var api_init_page = webpage.create();
    api_init_page.open(api_init_server, 'post', '', function(status){
        if(status !== 'success'){
            console.log('初始化失败');
        }else{
            console.log('初始化成功');
        }
        api_init_page.close();
        delete api_init_page;
    });

};

page.open("https://wx.qq.com/", function(status) {
    if ( status === "success" ) {
        //page.render('example.png');
        //phantom.exit();
    }
});

////////////////////////////////////////////////////////////////////////////////

page.onInitialized = function() {
    //console.log("### page.onInitialized ###");
};
page.onLoadStarted = function() {
    //console.log("### page.onLoadStarted ###");
};
page.onLoadFinished = function() {
    console.log("### page.onLoadFinished ###");
    page.evaluate(function(){
        delete console; // 防止 console被屏蔽
    });

    switch(current_url){
        case "https://wx.qq.com/":
        case "https://wx2.qq.com/?&lang=zh_CN":
            page.evaluate(function(_is_reload) {
                $('document').ready(function(){
                    console.log(_is_reload); // @todo 客户端退出后,reload不对.
                    if(!_is_reload) {
                        var get_qrcode_interval = setInterval(function () {
                            var qrcode_url = $('img.img[mm-src-load="qrcodeLoad"]').attr('src');
                            if (typeof qrcode_url != 'undefined') {
                                console.log('qrcode_url' + '|' + qrcode_url);
                                clearInterval(get_qrcode_interval);
                            } else {
                                console.log('正在加载登录二维码。。。');    // 等待登录二维码加载成功
                            }
                        }, 500);
                    }
                });
            }, is_reload);
            is_reload = false; // 刷新页面
        break;

        case "https://wx2.qq.com/":
            page.evaluate(function(_task_switch, _task, _auto_reply_switch, _auto_reply){
                $('document').ready(function(){
                    var task_switch = _task_switch; // 定时发送开关
                    var username = _task.username; //希望对话的用户名
                    var words = _task.words; // 要说的话
                    var send_time = _task.send_time; // 发送时间

                    var auto_reply_switch = _auto_reply_switch; // 自动回复开关
                    var auto_reply = _auto_reply; // 自动回复的内容

                    var current_username = $('span.display_name').html();
                    console.log(current_username + ' 账号已登录');

                    // 发送信息
                    var sendMessage = function(words){
                        $('#editArea').html(words).trigger('input'); // 输入聊天内容
                        $('a.btn_send').click();     // 发送聊天内容
                        $('div.chat_list div.ng-scope:last').prev('div.ng-scope').find('div.chat_item').click(); // 单击聊天列表最后一个，这样下次发来信息就会有红点。
                    };

                    if(task_switch) {
                        var task_interval = setInterval(
                            function () {
                                if ((Date.parse(new Date()) / 1000) == send_time) {
                                    $('input.frm_search').val(username).trigger('input'); // 搜索人名
                                    var waiting_interval = window.setInterval(
                                        function () {
                                            if ($('div.ng-scope[ng-repeat="item in allContacts"]:eq(1) div.contact_item').hasClass('on') === false) {
                                                console.log('正在加载搜索结果中。。。');    // 等待搜索结果加载成功
                                            } else {
                                                $('div.ng-scope[ng-repeat="item in allContacts"]:eq(1) div.contact_item').click();    // 选择第一条搜索结果
                                                sendMessage(words); // 发送信息
                                                console.log('已发送: ' + words);
                                                window.clearInterval(waiting_interval);
                                                window.clearInterval(task_interval);
                                            }
                                        }
                                        , 500);
                                } else {
                                    //console.log('正在等待。。。');
                                }
                            }
                            , 1000);
                    }

                    if(auto_reply_switch) {
                        var get_message_interval = setInterval(
                            function () {
                                if ($('div.chat_list i.web_wechat_reddot_middle:eq(0)').length <= 0) {
                                    //console.log('等待信息中。。。');
                                } else {
                                    $('div.chat_list i.web_wechat_reddot_middle:eq(0)').parents('div.ng-scope.chat_item:eq(0)').click(); // 点击第一个来信人物
                                    var message_come = '';
                                    var waiting_interval = window.setInterval(
                                        function () {
                                            if ($('div.message.you pre.js_message_plain:last').length <= 0) {
                                                console.log('正在加载聊天消息。。。'); // 等待聊天记录加载成功
                                            } else {
                                                message_come = $('div.message.you pre.js_message_plain:last').html(); // 获取最新一条发来的信息内容
                                                console.log('新消息: ' + message_come);
                                                // 处理接收到的内容
                                                var message_reply = (auto_reply == '') ? message_come : auto_reply; // 自动回复内容如果为空，那么就返回发来的内容
                                                sendMessage(message_reply); // 发送信息
                                                console.log('已回复: ' + message_reply);
                                                window.clearInterval(waiting_interval);
                                            }
                                        }
                                        , 500);
                                }
                            }
                            , 1000);
                    }
                });
            }, task_switch, task, auto_reply_switch, auto_reply);
        break;

        default:
    }

};
page.onUrlChanged = function(targetUrl) {
    //console.log("### page.onUrlChanged ###");
    console.log('New URL: ' + targetUrl);
    current_url = targetUrl;
};

page.onNavigationRequested = function() {
    //console.log("### page.onNavigationRequested ###");
};

page.onRepaintRequested = function() {
    //console.log("### page.onRepaintRequested ###");
};


page.onResourceRequested = function() {
    //console.log("### page.onResourceRequested ###");
};
page.onResourceReceived = function(response) {
    //console.log("### page.onResourceReceived ###");
    //console.log('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response));
};


page.onClosing = function() {
    //console.log("### page.onClosing ###");
};

// window.console.log(msg);
page.onConsoleMessage = function(msg) {
    //console.log("### page.onConsoleMessage ###");
    console.log(msg);
    var param_arr = String(msg).split('|', 2);
    if(typeof param_arr[1] != 'undefined' && param_arr[1] != null) {
        window[param_arr[0]] = param_arr[1]; // 将返回的数据输出出来
    }

    // 输出qrcode图片
    if(typeof qrcode_url != 'undefined' && qrcode_url != null){
        init();
        console.log('登录二维码URL: ' + qrcode_url);  // qrcode_url
        var qrcode_page = webpage.create();
        qrcode_page.open(qrcode_url, function(status){});
        qrcode_page.onLoadFinished = function(){
            qrcode_page.render(qrcode_path + 'wechat_qrcode.png');
            qrcode_page.close();
            delete qrcode_page;
            delete qrcode_url;
            console.log('登录二维码已生成');
            //@todo 发送推送，提示用户扫描二维码
        };
    }

};

// window.alert(msg);
page.onAlert = function(msg) {
    //console.log("### page.onAlert ###");
};
// var confirmed = window.confirm(msg);
page.onConfirm = function(msg) {
    //console.log("### page.onConfirm ###");
};
// var user_value = window.prompt(msg, default_value);
page.onPrompt = function(msg, default_value) {
    //console.log("### page.onPrompt ###");
};

////////////////////////////////////////////////////////////////////////////////


// 轮询定时发送任务 及 自动回复参数
setInterval(function(){
    var api_page = webpage.create();
    var data = '';
    api_page.open(api_server, 'post', data, function (status) {
        if (status !== 'success') {
            console.log('轮询失败');
        } else {
            var content = api_page.plainText;
            console.log(content);
            if(content != ''){
                content = JSON.parse(content);
                if(content.is_logout != false){
                    var current_username = page.evaluate(function(){
                                                $('i.web_wechat_add').parents('a.opt').click();
                                                $('i.menuicon_quit').parents('a[title="退出"]').click();
                                                var current_username = $('span.display_name').html();

                                                return current_username;
                                            });

                    var api_logout_page = webpage.create();
                    var data = '';
                    api_logout_page.open(api_logout_server, 'post', data, function(status){
                        if(status !== 'success'){
                            console.log(current_username + '账号退出失败');
                        }else{
                            var content = api_logout_page.plainText;
                            if(content == 'ok'){
                                is_reload = false; // 退出账户, 重新加载
                                console.log(current_username + ' 账号已退出');
                            }else{
                                console.log(current_username + '账号退出失败');
                            }
                        }
                        api_logout_page.close();
                        delete api_logout_page;
                    });
                }else{
                    console.log(JSON.stringify(content));
                    task = content.task;
                    auto_reply = content.auto_reply;
                    task_switch = content.task_switch;
                    auto_reply_switch = content.auto_reply_switch;
                    is_reload = true; // 刷新页面
                    page.reload();  // 刷新页面
                    console.log('轮询成功, 任务配置已更新');
                }
            }else{
                //console.log(content);
                //console.log('轮询成功');
            }
        }
        api_page.close();
        delete api_page;
    });
}, 3000);