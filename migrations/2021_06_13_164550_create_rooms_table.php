<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRoomsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('s_id' )->unsigned()->index();
            $table->foreign( 's_id' )->references( 'id' )->on( 'users' )->onDelete( 'cascade' );

            $table->unsignedBigInteger('r_id' )->unsigned()->index();
            $table->foreign( 'r_id' )->references( 'id' )->on( 'users' )->onDelete( 'cascade' );

            $table->enum('status',['on','off'])->default('on');

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
        Schema::dropIfExists('rooms');
    }
}
