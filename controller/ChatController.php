<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\Api\ChatResource;
use App\Http\Resources\Api\RoomResource;
use App\Http\Resources\Api\UsersResource;
use App\Models\Chat;
use App\Models\DeletedRoom;
use App\Models\User;
use App\Traits\Responses;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Room;
use App\Models\ArchivedRoom;
use Carbon\Carbon;
class ChatController extends Controller
{
    use     Responses;


     public function sendMessage(Request $request){

         $r_id              =   $request['user_id'];

         $room              =   Room::where(function ($query) use  ($r_id) {
             $query->where('s_id', auth()->id())
                   ->where('r_id'  , $r_id);
         })->orWhere(function ($query) use ($r_id) {
             $query->where( 's_id', $r_id)
                    ->where('r_id', auth()->id());
         })->orderBy('id', 'desc')
             ->first();


         if(!$room)
             $room          =    Room::create([
                 's_id'     =>   auth()->id(),
                 'r_id'     =>   $r_id,
             ]);


         $blocked           = DeletedRoom::whereRoomId($room->id)->first();
         if($blocked)
             $this->ApiResponse('failed',__('apis.userBlocked'));

         $archived          = ArchivedRoom::whereRoomId($room->id)->first();
         if($archived)
             $archived->delete();


         $chat              =    $room->chat()->create([
             's_id'         =>   auth()->id(),
             'message'      =>   $request['type'] == 'map' ? json_encode($request['message']) : $request['message'],
             'seen'         =>   false,
             'type'         =>   isset($request['type']) ? $request['type'] : 'text'
         ]);

         $chat->chatRoom->update(['updated_at' => Carbon::now()]);

         $this->ApiResponse('success','', new ChatResource($chat));

     }

    public function rooms(){
        $user          = auth()->user();
        $search        = request('name');
        $rooms         = Room::with('sender')->with('receiver')->where(function ($query) use ($user, $search) {

            $query->where('s_id', auth()->id())
            ->whereNotIn('id' , $user->deleted_rooms?$user->deleted_rooms->pluck('room_id'):[])
            ->whereNotIn('id' , !is_null($search)  ? [] : $user->archived_rooms->pluck('room_id'));

        })->orWhere(function ($query) use ($user , $search) {
            $query->where('r_id'  ,  auth()->id())
            ->whereNotIn('id' , $user->deleted_rooms->pluck('room_id'))
            ->whereNotIn('id' , !is_null($search)  ? [] : $user->archived_rooms->pluck('room_id'));

        })  ->whereHas('receiver',function ($q){
            if(!is_null(request('name')))
                $q->where('name','like','%'. request('name').'%');
        })->orderBy('updated_at', 'DESC')
            ->distinct()
            ->paginate(app()->pagination);

        $this->ApiResponse('success','',  RoomResource::collection($rooms));
    }


    public function inbox(Request $request){
        $room =   DeletedRoom::whereRoomId($request['room_id'])->first() ? 'blocked' : 'active';

        $this->ApiResponse('success','',  ChatResource::collection(Chat::whereRoomId($request['room_id'])->get()) ,  ['is_blocked' => $room ]);
    }

    public function deleteConversation(Request $request){
        DeletedRoom::firstOrCreate(
            ['room_id' =>  $request['room_id']]
            ,['user_id' => auth()->id(), 'room_id' => $request['room_id']]);
        $this->ApiResponse('success',__('apis.room-deleted'));
    }

    public function archiveConversation(Request $request){
        ArchivedRoom::create(['user_id' => auth()->id(), 'room_id' => $request['room_id']]);
        $this->ApiResponse('success',__('apis.room-archived'));
    }


    public function users(){
        $users            = User::whereBlock(false)->whereActive(true)->paginate(app()->pagination);
        $this->ApiResponse('success','' ,UsersResource::collection($users));
    }
    public function blockUser(Request $request){
        $r_id              =   $request['user_id'];
        $room              =   Room::where(function ($query) use  ($r_id) {
            $query->where('s_id', auth()->id())
                ->where('r_id'  , $r_id);
        })->orWhere(function ($query) use ($r_id) {
            $query->where( 's_id', $r_id)
                ->where('r_id', auth()->id());
        })->orderBy('id', 'desc')
            ->first();

        if(!$room)
            $room          =    Room::create([
                's_id'     =>   auth()->id(),
                'r_id'     =>   $r_id,
            ]);


        DeletedRoom::firstOrCreate([
            'room_id'     => $room->id
        ],[
            'user_id'     => auth()->id(),
            'room_id'     => $room->id
        ]);
        $this->ApiResponse('success',__('apis.blocked') );
    }


}
