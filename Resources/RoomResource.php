<?php

namespace App\Http\Resources\Api;

use App\Models\DeletedRoom;
use Illuminate\Http\Resources\Json\JsonResource;
class RoomResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'room_id'      =>  $this->id,
            'time'         =>  $this->updated_at->diffForHumans(),
            'un_seen'      =>  $this->chat()->where('seen','0')->count(),
            'message'      =>  $this->chat()->orderBy('id','DESC')->first()->message,
            'type'         =>  $this->chat()->orderBy('id','DESC')->first()->type,
            'name'         =>  (auth()->user()->id == $this->sender->id ) ?  $this->receiver->name   : $this->sender->name ,
            'avatar'       =>  (auth()->user()->id == $this->sender->id ) ?  $this->receiver->avatar : $this->sender->avatar ,
            'is_blocked'   =>  DeletedRoom::whereRoomId($this->id)->first() ? true : false

        ];
    }

}
