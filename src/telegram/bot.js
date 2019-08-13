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
let BOT_EVENTS = null;
let BOT_TRIGGERS = null;
let NAME_REGEX = null;

const EV_NEW_MEMBER = "new_member";
const EV_BOT_ADDED = "bot_added";

const USR_REPLACER = "{usr}";


//init is at the end of the file because routes need to know the bot logic in order to work

/* ======================================================================================== */
// Logic

    //TODO: add message with only bot name as event

/**
 * Search for a trigger in the message
 * @param {*} message 
 */    
function searchTextTrigger(message)
{
    if(!BOT_TRIGGERS)
        return null;
    
    let text = message["text"].toLowerCase();

    let isReply = message["reply_to_message"] && message["reply_to_message"]["from"]["username"] == BOT_DATA["usr"];
    let isPvt = message["chat"]["type"] == "private";

    if(isPvt || isReply || text.match(NAME_REGEX))
    {
        //regular named triggers
        for(let i = 0; i < BOT_TRIGGERS["require_name"].length; i++)
        {
            if(text.match(BOT_TRIGGERS["require_name"][i]))
                return BOT_TRIGGERS["require_name"][i];
        }
    }    
    else
    {
        //unnamed triggers
        for(let i = 0; i < BOT_TRIGGERS["unnamed"].length; i++)
        {
            if(text.match(BOT_TRIGGERS["unnamed"][i]))
                return BOT_TRIGGERS["unnamed"][i];
        }
    }

    return null;

}


function getTriggerReplyText(trigger)
{
    let idx = Math.floor(trigger["out"].length * Math.random());
    return trigger["out"][idx];
}

/**
 * generate message reply
 * @param {*} message 
 */
function onMessageReceived(message)
{
    let reply = "ok";

    if(message["text"])
    {
        let trigger = searchTextTrigger(message);

        let rpltxt = null;

        if(trigger != null)
        {
            console.log("Trigger found : "+ trigger["name"]);

            rpltxt = getTriggerReplyText(trigger).replace(USR_REPLACER, message["from"]["first_name"]);
        }
        else
        {
            // fallback trigger here
            console.log("no trigger found :L");
            return null;
        }

        if(rpltxt)
            reply = {"method":"sendMessage", "text": rpltxt, "chat_id": message["chat"]["id"]};
        else
            reply = "ok"; 
    }
    else
    {
        reply = "ok";
    }

    return reply;
}


/**
 * Create a reply for an event
 * @param {*} name 
 * @param {*} chat_id
 * @param {*} dest user name to target the message
 * 
 * if null event is not handled
 */
function onEvent(name, chat_id, dest = "")
{
    let ev = BOT_EVENTS[name];
    if(ev)
    {
        let idx = Math.floor(ev.length * Math.random());
        let reply = {"method":"sendMessage", "text": ev[idx].replace(USR_REPLACER, dest), "chat_id":chat_id};
        return reply;
    }

    return null;
}


/**
 * return reply if event is handled, null if not
 * @param {*} message 
 */
function checkNewMemberEvent(message)
{
    let res = null;

    if(message["new_chat_members"])
    {
        let usr = message["new_chat_members"][0]

        if(usr["username"] == BOT_DATA["usr"]) // bot added to chat
        {
            res = onEvent(EV_BOT_ADDED, message["chat"]["id"]);
        }
        else 
        {
            res = onEvent(EV_NEW_MEMBER, message["chat"]["id"], usr["first_name"]);
        }
        
    }

    return res;
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
        let ev = checkNewMemberEvent(body["message"]);
        if(ev != null)
            return ev;

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
 * Request bot username from api
 */
async function getBotusername()
{
    let resp = await r2(API_BASE_ULR + "/bot" + BOT_DATA["tkn"] + "/getMe").json;
    if(!resp["result"])
    {
        console.log("Unable to get bot username: " + JSON.stringify(resp));
        return "";
    }
    else
    {
        console.log("Bot username: "+ resp["result"]["username"]);
        return resp["result"]["username"];
    }
}


/**
 * Compile a trigger into a regex to use to check
 * @param {} trigger 
 */
function compileTrigger(trigger)
{
    let rgx = "\\b(";

    for(let i =0; i < trigger["in"].length; i++)
    {
        rgx += trigger["in"][i].toLowerCase();

        if(i != trigger["in"].length -1)
            rgx += "|";
    }

    rgx += ")\\b";
    
    return rgx;
}


/**
 * Load triggers from database and compile them into regex
 */
async function loadAndCompileTriggers()
{
    let trg = await db.loadTriggers();

    if(trg == null)
        return null;

    console.log("Compiling triggers...");

    for(let i =0; i < trg["require_name"].length; i++)
    {
        trg["require_name"][i]["rgx"] = compileTrigger(trg["require_name"][i]);
        console.log("Compiled " + trg["require_name"][i]["name"] + " to: " + trg["require_name"][i]["rgx"] );
    }

    for(let i =0; i < trg["unnamed"].length; i++)
    {
        trg["unnamed"][i]["rgx"] = compileTrigger(trg["unnamed"][i]);
        console.log("Compiled " + trg["unnamed"][i]["name"] + " to: " + trg["unnamed"][i]["rgx"] );
    }

    return trg;
}


/**
 * Compile the possibile names (+ username) into a check regex
 */
function compileNameChecker()
{
    BOT_DATA["nms"].push(BOT_DATA["usr"]);

    let rgx = "\\b(";

    for(let i =0; i < BOT_DATA["nms"].length; i++)
    {
        rgx += BOT_DATA["nms"][i].toLowerCase();

        if(i != BOT_DATA["nms"].length -1)
            rgx += "|";
    }

    rgx += ")\\b";
    
    return rgx;
}

/**
 * Initialize telegram bot
 */
async function init()
{
    db.init();

    BOT_DATA = await db.getBotInfo();
    BOT_DATA["usr"] = await getBotusername();

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

    BOT_EVENTS = await db.loadEvents();
    BOT_TRIGGERS = await loadAndCompileTriggers();

    //compile name regex
    NAME_REGEX = compileNameChecker();

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
