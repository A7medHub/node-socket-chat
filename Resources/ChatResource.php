<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;
class ChatResource extends JsonResource
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
            'id'                               => (int)     $this->id,
            'message'                          =>  $this->type == 'map' ? $this->convert( $this->message) :  $this->message,
            'user'                             =>    [
                'name'                         => $this->sender->name,
                'avatar'                       => $this->sender->avatar,
            ],
            'time'                             => $this->created_at->diffForHumans(),
            'type'                             => $this->type,
            'alignItem'                        => auth()->id() == $this->s_id ? 'right' : 'left'
        ];
    }



    public function convert($coordinates){
        $data = json_decode($coordinates);
        return (object) ['lat' => $data[0]->lat, 'lng' => $data[0]->lng ];
    }
}
