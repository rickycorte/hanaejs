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

const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');
const uuidv5 = require('uuid/v5');

const MONGO_URL = process.env.MONGO_URL;

const DB_NAME = "HanaeJS";
const BOT_COLLECTION = "Bots";
const USR_COLLECTION = "Users";

let initCalled = false;
let db = null;

/* ======================================================================================== */
// init

/**
 * Initialize database module
 * May be called once
 */
async function init()
{
    if(initCalled) return; // prevent multiple initializations

    if(!MONGO_URL)
    {
        console.error("Please add MONGO_URL env var, Mongodb connection is required!");
        process.exit(1);
    }

    let client = new MongoClient(MONGO_URL, { useNewUrlParser: true,  useUnifiedTopology: true });

    try
    {
        await client.connect();
        db = client.db(DB_NAME);
    }
    catch(e)
    {
        console.log("Unable to open database connection:" + e.message);
        process.exit(1);
    }

    console.log("Database: " + (db ? "ready" : "not ready") );

    initCalled = true;
}


/* ======================================================================================== */
// telegram

/**
 * Load bots from the database
 * 
 * @returns array of bots, empty array if there are no bots
 */
async function getBots()
{
    try
    {
        let res = await db.collection(BOT_COLLECTION).find();
        return await res.toArray();
    }
    catch(e)
    {
        console.log("Unable to load bots: " + e.message);
        return [];
    }
}


/* ======================================================================================== */
// users


/**
 * Checks if there are any users in the database
 * 
 * @returns true is any, false if no user is present
 */
async function hasUsers()
{
    try
    {
        let res = await db.collection(USR_COLLECTION).findOne();
        //console.log(res);
        if(!res)
            return false;
    }
    catch{}

    return true;
}

/**
 * Create a new user
 * 
 * @param {*} username 
 * @param {*} password 
 * 
 * @returns newly created user
 */
async function createUser(username, password)
{
    if(!username || username.length < 5)
        throw new Error("Username must have at least 5 characters");
    
    if(!password || password.length < 8)
        throw new Error("Password must have at least 8 characters");

    let res = await db.collection(USR_COLLECTION).findOne({username : username});
    if(res)
    {
        //console.log(res); // TODO: remove after debug
        throw new Error("User already exists");
    }
    else
    {
        let usr = {
            username: username,
            password_hash: bcrypt.hashSync(password, 10),
            uuid: uuidv5(username, uuidv5.DNS),
            default_bot: null,
            bots: []
        };
        res = await db.collection(USR_COLLECTION).insertOne(usr);

        console.log("Created user: "+ username);

        return usr;
    }

    return null;
}


/**
 * Authenticate a user
 * 
 * @param {string} username 
 * @param {string} password 
 * 
 * @returns null if user not exists/wrong username/password, user object if auth data is correct
 */
async function authUser(username, password)
{
    try
    {
        if(!username || !password)
            return false;

        let res = await db.collection(USR_COLLECTION).findOne({username : username});

        if(res && bcrypt.compareSync(password, res.password_hash))
        {
            console.log("Authenticated user: "+ username);
            return res;
        }
    }
    catch(e)
    {
        console.log("Auth error for user '"+username+"': "+ e.message);
        return null;
    }

}

/* ======================================================================================== */
// exports
exports.init = init;
exports.getBots = getBots;
exports.hasUsers = hasUsers;
exports.authUser = authUser;
exports.createUser = createUser;