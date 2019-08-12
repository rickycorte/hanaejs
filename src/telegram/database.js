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


const admin = require('firebase-admin');

const BOT_DB_NAME = process.env.BOT_DB_NAME | "hanae"; // in future this won't be hardcoded 


//db structure names
const BOT_INFO_LBL = "info";
const BOT_EVENTS_LBL = "events";

let db = null;

/* ======================================================================================== */
// init & conf


function init()
{
    // check if vars are set
    if(db)
        return;

    if(!process.env.FIREBASE_PROJ_ID)
    {
        console.log("Please set FIREBASE_PROJ_ID env var");
        process.exit(1);
    }

    if(!process.env.FIREBASE_CLIENT_EMAIL)
    {
        console.log("Please set FIREBASE_CLIENT_EMAIL env var");
        process.exit(1);
    }

    if(!process.env.FIREBASE_PRIVATE_KEY)
    {
        console.log("Please set FIREBASE_PRIVATE_KEY env var");
        process.exit(1);
    }

    if(!process.env.FIREBASE_DB_URL)
    {
        console.log("Please set FIREBASE_DB_URL env var");
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJ_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        }),
        databaseURL: process.env.FIREBASE_DB_URL
      });
      
    db = admin.firestore();
}




/* ======================================================================================== */
// queries

/**
 * Return bot informations (blocking db query)
 */
async function getBotInfo()
{
    try
    {
        let info = await db.collection(BOT_DB_NAME).doc(BOT_INFO_LBL).get();
        return info.data();
        
    }
    catch(err)
    {
        console.log("Unable to load bot infos from firebase: " + err);
        return null;
    }
}


async function loadEvents()
{
    try
    {
        let ev = await db.collection(BOT_DB_NAME).doc(BOT_EVENTS_LBL).get();
        if(ev.exists)
        {
            return ev;
        }
        else
        {
            throw new Error(BOT_EVENTS_LBL + " document does not exist");
        }
    }
    catch(err)
    {
        console.log("Unable to load events: "+ err);
        return null;
    }
}


/* ======================================================================================== */
// Exports
exports.init = init;
exports.getBotInfo = getBotInfo;
exports.loadEvents = loadEvents;