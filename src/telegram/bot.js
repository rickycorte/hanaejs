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
const db = require("./database");

const express = require('express');
const router = express.Router();

const API_BASE_ULR = "https://api.telegram.org"


let BOT_DATA = null;


//init is at the end of the file because routes need to know the bot logic in order to work

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
 * 
 * webhook ready reply or null if this request is skipped
 */
function onTelegramUpdate(body)
{

    console.log("Update received : %j", body);

    if(body["message"])
    {
        return onMessageReceived(body["message"]); // create reply
    }
    else if(body["edit_message"])
    {
        return onMessageReceived(body["edit_message"]); // create reply
    }
    else
    {
        console.log("Not supported message received!");
        return null // inform telegram that message has been evaluated 
    }

}


/**
 * Replay to telegram update received from express route
 * @param {*} req 
 * @param {*} reply 
 */
function onExpressUpdate(req, reply)
{
    let res = onTelegramUpdate(req.body);
    if(res)
    {
        reply.send(res);
    }
    else
    {
        reply.send("ok");
    }
}

/* ======================================================================================== */
// init & conf


/**
 * Set express routes to handle requests
 */
function setExpressRoutes()
{
    router.get('/telegram/test',
    (req, res) => { 
        let reply = { "status": "ok", "message": "Telegram api ready" };
        res.send(reply); 
    });

    router.post("/telegram/" +  BOT_DATA["tkn"], onExpressUpdate);
}


/**
 * Set webhook
 */
async function setWebhook()
{
    if(!BOT_DATA)
    {
        BOT_DATA = {"tkn": "tgdev", "url": "127.0.0.1"};

        console.log("Unable to load bot informations")
    }
    else
    {
        let url = "https://" + BOT_DATA["url"] + "/telegram/" +  BOT_DATA["tkn"];

        let resp = await r2(API_BASE_ULR + "/bot" + BOT_DATA["tkn"] + "/setWebhook?url=" + url ).json;
        if(!resp["result"])
        {
            console.log("Unable to set telegram webhook: %j", resp);
        }
        else
        {
            console.log("Set webhook to: " + url);
        }
    }
}

/**
 * Remove webhook
 */
async function removeWebhook()
{
    let resp = await r2(API_BASE_ULR + "/bot" + BOT_DATA["tkn"] + "/deleteWebhook").json;
    if(!resp["result"])
    {
        console.log("Unable to delete telegram webhook: " + JSON.stringify(resp));
    }
    else
    {
        console.log("Deleted webhook");
    }
}



/**
 * Initialize telegram bot
 */
async function init()
{
    db.init();

    BOT_DATA = await db.getBotInfo();

    if(process.env.RELEASE)
    {
        //release set webhook
        await setWebhook();
        setExpressRoutes();
    }
    else
    {
        //polling
        removeWebhook();
    }
}


/* ======================================================================================== */
// Poll (DEBUG)

let last_poll_id = 0;

async function poll()
{
    let resp = await r2(API_BASE_ULR + "/bot" + BOT_DATA["tkn"] + "/getUpdates?offset="+ last_poll_id).json;
    //console.log("Got: ", JSON.stringify(resp));

    if(resp["ok"])
    {
        resp["result"].forEach( (itm) => {

            let res = onTelegramUpdate(itm);
            last_poll_id = itm["update_id"] + 1;

            if(res)
            {
                let mth = res["method"];
                let param = "";
                delete res["method"];

                for(let key in res)
                {
                    if(param != "")
                        param += "&";

                    param += key + "=" + encodeURI(res[key]);
                }

                console.log("Polling reply: " + API_BASE_ULR + "/<hidden>/" + mth +"?" + param);
                r2(API_BASE_ULR + "/bot" + BOT_DATA["tkn"] + "/" + mth +"?" + param);
            }

        });
    }
    else
    {
        console.log("GetUpdates error: %j", resp);
    }

}


/* ======================================================================================== */
// Exports

exports.router = router;
exports.init = init;
exports.poll = poll;
