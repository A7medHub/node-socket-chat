<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = ['s_id','r_id'];


    public function sender()
    {
        return $this->belongsTo('App\Models\User','s_id');
    }

    public function receiver()
    {
        return $this->belongsTo('App\Models\User','r_id');
    }

    public function chat(){
        return $this->hasMany('App\Models\Chat','room_id','id');
    }

    public function deleted_rooms(){
        return $this->hasMany(DeletedRoom::class);
    }
    public function archived_rooms(){
        return $this->hasMany(ArchivedRoom::class);
    }
}