<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateChatsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->text('message');
            $table->boolean('seen')->default(false);
            $table->enum('type',['text','map','file','image'])->default('text');
            $table->unsignedBigInteger('s_id' )->unsigned()->index();
            $table->foreign( 's_id' )->references( 'id' )->on( 'users' )->onDelete( 'cascade' );
            $table->unsignedBigInteger('room_id' )->unsigned()->index();
            $table->foreign( 'room_id' )->references( 'id' )->on( 'rooms' )->onDelete( 'cascade' );
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('chats');
    }
}
