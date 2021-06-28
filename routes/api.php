<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/


Route::group(['prefix'                  => 'v1'            , 'namespace' => 'Api\V1']  , function () {
    Route::group(['middleware'          => ['localization']]                 , function (){




        Route::group(['middleware'       => ['jwtOptional'  ,'localization']], function (){

        });

        Route::group(['middleware'       => ['jwt']]        , function (){
                #logout

                Route::post('send-message'              , 'ChatController@sendMessage')             ;
                #rooms
                Route::get('rooms'                      , 'ChatController@rooms')                   ;
                #inbox
                Route::post('inbox'                     , 'ChatController@inbox')                   ;
                #delete conversation
                Route::post('delete-conversation'       , 'ChatController@deleteConversation')      ;
                #archive conversation
                Route::post('archive-conversation'      , 'ChatController@archiveConversation')     ;
                #users
                Route::post('users'                     , 'ChatController@users')                   ;
                #users
                Route::post('block-user'                , 'ChatController@blockUser')               ;


        });

    });

 });
