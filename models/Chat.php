<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $fillable = ['s_id','message','room_id','type','seen'];


    public function sender(){
        return $this->belongsTo('App\Models\User','s_id');
    }
    public function chatRoom(){
        return $this->belongsTo('App\Models\Room','room_id','id');
    }
}