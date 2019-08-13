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

const USER_DB = "users"; // in future this won't be hardcoded 

let db = null;

/* ======================================================================================== */
// init & conf

// admin initialized in telegram bot

async function init()
{
    db = admin.firestore();
    console.log("web db ready: " + (db != null));
}



/* ======================================================================================== */
// functions

/**
 * Check if the user is in the database
 * @param {*} user 
 */
async function isUserInDB(user)
{
    if(!user)
    {
        console.log("No user passed: "+ user);
        return false;
    }

    try
    {
        console.log("Searching user: " + user);
        let doc = await db.collection(USER_DB).doc(user).get();
        if(doc.exists)
            return true;
    }
    catch(err)
    {
        console.log("Unable to get user: "+ user +". Error " + err);
        return false;
    }

    return false;
}

/* ======================================================================================== */
// exports
exports.init = init;
exports.isUserInDB = isUserInDB;