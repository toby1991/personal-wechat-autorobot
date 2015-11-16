<?php
namespace App\Http\Controllers\xxx;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use Cache;
class IndexController extends Controller
{
	protected $wechat_robot_timeout = 60; // 微信机器人超时分钟数

	public function wechatRobot(Request $request){
        $wechat_robot_status_cache = 'xxx:Index:wechatrobot:wechatrobot_status';
        $wechat_robot_cache = 'xxx:Index:wechatrobot:wechatrobot';

        if(!Cache::has($wechat_robot_status_cache) || Cache::get($wechat_robot_status_cache) === 0){
            $data['task_switch'] = false;
            $data['task'] = [
                'username' => '',
                'words' => '',
                'send_time' => time(),
            ];
            $data['auto_reply_switch'] = false;
            $data['auto_reply'] = '';
            $data['is_logout'] = true;
            $data['is_using'] = false;
        }else{
            $data = Cache::get($wechat_robot_cache);
            $data['is_using'] = true; // 有人正在使用
        }

        $view_name = 'xxx.wechatrobot';
        return view($view_name)->with($data);
    }

    public function ajax_postWechatRobot(Request $request){
        $wechat_robot_cache = 'xxx:Index:wechatrobot:wechatrobot';
        $wechat_robot_status_cache = 'xxx:Index:wechatrobot:wechatrobot_status';

        if(!Cache::has($wechat_robot_status_cache) || Cache::get($wechat_robot_status_cache) === 0){
            $request_data = $request->all();

            if(isset($request_data['task_switch'])){
                $request_data['task_switch'] = true;
            }else{
                $request_data['task_switch'] = false;
            }

            if(isset($request_data['auto_reply_switch'])){
                $request_data['auto_reply_switch'] = true;
            }else{
                $request_data['auto_reply_switch'] = false;
            }

            if(empty($request_data['task']['username'])){
                $request_data['task']['username'] = md5('HeadFile Studio');
            }

            $request_data['task']['send_time'] = strtotime($request_data['task']['send_time']);
            $request_data['is_logout'] = false; //暂时都是false

            $final_data['task_switch'] = $request_data['task_switch'];
            $final_data['task']['username'] = $request_data['task']['username'];
            $final_data['task']['words'] = $request_data['task']['words'];
            $final_data['task']['send_time'] = $request_data['task']['send_time'];

            $final_data['auto_reply_switch'] = $request_data['auto_reply_switch'];
            $final_data['auto_reply'] = $request_data['auto_reply'];

            $final_data['is_logout'] = $request_data['is_logout'];

            Cache::put($wechat_robot_cache, $final_data, $this->wechat_robot_timeout); // 60分钟自动退出登录
            Cache::put($wechat_robot_status_cache, 1, $this->wechat_robot_timeout); // 60分钟自动退出登录

            return 'ok';
        }else{
            return 'in use'; // 有人正在使用
        }
    }

    public function ajax_getWechatRobot(Request $request){
        $wechat_robot_cache = 'xxx:Index:wechatrobot:wechatrobot';
        $wechat_robot_last_cache = 'xxx:Index:wechatrobot:wechatrobot_last';
        $wechat_robot_status_cache = 'xxx:Index:wechatrobot:wechatrobot_status';

        if(!Cache::has($wechat_robot_status_cache) || Cache::get($wechat_robot_status_cache) === 0){
            // 登录过期,退出登录

            if(!Cache::has($wechat_robot_cache)){
                return '';
            }else {
                $wechat_robot['task_switch'] = false;
                $wechat_robot['task']['username'] = md5('HeadFile Studio');
                $wechat_robot['task']['words'] = '';
                $wechat_robot['task']['send_time'] = time() - 1000000;

                $wechat_robot['auto_reply_switch'] = false;
                $wechat_robot['auto_reply'] = '';

                $wechat_robot['is_logout'] = true; // 登出

                return json_encode($wechat_robot);
            }
        }else {
            $wechat_robot = Cache::get($wechat_robot_cache);
            $wechat_robot_last = Cache::get($wechat_robot_last_cache);

            if (md5(serialize($wechat_robot)) != md5(serialize($wechat_robot_last))) {
                // 不同，返回
                Cache::put($wechat_robot_last_cache, $wechat_robot, $this->wechat_robot_timeout); // 存储上次的，用于对比
                return json_encode($wechat_robot);
            } else {
                return '';
            }
        }
    }

    public function ajax_logoutWechatRobot(Request $request){
        $wechat_robot_status_cache = 'xxx:Index:wechatrobot:wechatrobot_status';

        Cache::put($wechat_robot_status_cache, 0, $this->wechat_robot_timeout);

        return 'ok';
    }

    public function ajax_initWechatRobot(Request $request){
        $wechat_robot_cache = 'xxx:Index:wechatrobot:wechatrobot';
        $wechat_robot_last_cache = 'xxx:Index:wechatrobot:wechatrobot_last';
        $wechat_robot_status_cache = 'xxx:Index:wechatrobot:wechatrobot_status';

        Cache::forget($wechat_robot_cache);
        Cache::forget($wechat_robot_last_cache);
        Cache::forget($wechat_robot_status_cache);

        return 'ok';
    }
}

?>