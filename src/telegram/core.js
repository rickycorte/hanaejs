/*
*   Hanae Js
*   Copyright (C) 2019  RickyCorte (https://rickycorte.com)
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published
*   by the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <https://www.gnu.org/licenses/>.
* 
*/

'use strict';

const r2 = require("r2");


/* ======================================================================================== */
// init & conf

const express = require('express');
const router = express.Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "tgdev";
const API_BASE_ULR = "https://api.telegram.org"
const TELEGRAM_WEBOOK_BASE_URL = process.env.TELEGRAM_WEBOOK_BASE_URL

async function init()
{
    //set webhook
    if(TELEGRAM_BOT_TOKEN == "tgdev")
    {
        console.log("No token set for bot, using tgdev as token/path")
    }
    else
    {
        let resp = await r2(API_BASE_ULR + "/bot" + TELEGRAM_BOT_TOKEN + "/setWebhook?url="+TELEGRAM_WEBOOK_BASE_URL+"/telegram/"+TELEGRAM_BOT_TOKEN).json;
        if(!resp["result"])
        {
            console.log("Unable to set telegram webhook: %j", resp);
        }
        else
        {
            console.log("Set webhook to: " + TELEGRAM_WEBOOK_BASE_URL + "/telegram/<your token here :3>");
        }
    }

    //init bot
}


/* ======================================================================================== */
// Logic


/**
 * generate message reply
 * @param {*} message 
 */
function onMessageReceived(message)
{
    let reply = {};

    if(message["text"])
    {
        reply = {"method":"sendMessage", "text":"Echo: "+message["text"], "chat_id": message["chat"]["id"]};
    }
    else
    {
        reply = "ok";
    }

    return reply;
}

/**
 * Replay to telegram update
 * @param {*} req 
 * @param {*} reply 
 */
function onTelegramUpdate(req, reply)
{
    let body = req.body;

    if(body["message"])
    {
        reply.send(onMessageReceived(body["message"])); // create reply
    }
    else if(body["edit_message"])
    {
        reply.send(onMessageReceived(body["edit_message"])); // create reply
    }
    else
    {
        console.log("Not supported message received!");
        reply.send("ok"); // inform telegram that message has been evaluated 
    }

    console.log("Update received : %j", body);
}

/* ======================================================================================== */
// routes

router.get('/telegram/test',
 (req, res) => { 
    let reply = { "status": "ok", "message": "Telegram api ready" };
    res.send(reply); 
});

router.post("/telegram/"+TELEGRAM_BOT_TOKEN, onTelegramUpdate);


router.pos

/* ======================================================================================== */
// Exports

exports.router = router;
exports.init = init;
