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


const express = require('express');
const jwt = require('jsonwebtoken');

const checkMw = require("@middleware/jwtVerify");
const noCacheMw = require("@middleware/forceNoCache");
const db = require("@database/database");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "TotallySuperSecretKey";
const JWT_TOKEN_LIFETIME = process.env.JWT_TOKEN_LIFETIME || "1h";


/* ======================================================================================== */
// functions

/**
 * Init module
 */
async function init()
{
    let res = await db.hasUsers();
    if(!res)
    {
        await db.createUser("admin", "adminpwd");
        console.log("Created default admin user");
    }

    console.log("Auth: ready");
}


/**
 * Create JWT Token
 * 
 * @param {*} userID user uuid
 * 
 * @returns jwt token string
 */
function makeJWTToken(userID) {
    return jwt.sign({ id: userID }, JWT_SECRET, { expiresIn: JWT_TOKEN_LIFETIME });
}


/**
 * Handle login request
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function login(req, res)
{
    try
    {
        let username = req.body.username;
        let password = req.body.password;

        let usr = await db.authUser(username, password);
        if(usr)
        {
            let token = makeJWTToken(req.body["user"]);
            res.status(200).send({ status: "ok", auth: true, token: token });
            console.log("User '"+ username + "' logged in");
            return;
        }
    }
    catch(e)
    {
        console.log("Login error: "+ e.message);
    }   

    res.status(401).send({
        result: "error",
        auth: false,
        message: "Could not authenticate user"
    });

    console.log("Failed login attempt for: "+ username);
} 


/**
 * Handle auth check request
 * 
 * @param {*} req 
 * @param {*} res 
 */
function checkAuthReply(req, res) 
{
    res.status(200).send({ result: "ok", auth: true, message: "Authenticated"});
}


/**
 * Handle change password request
 * @param {*} req 
 * @param {*} res 
 */
async function changePassword(req, res)
{
    try
    {
        let username = req.body.username;
        let password = req.body.password;
        let new_password = req.body.new_password;

        let usr = await db.changeUserPassword(username, password, new_password);
        if(usr)
        {
            res.status(200).send({ result: "ok", message: "Updated password"});
            return;
        }

    }
    catch(e)
    {
        console.log("Unable to change password"+e.message);
    }

    res.status(401).send({ result: "error", message: "Could not authenticate user"});

    console.log("Failed attempt to change '"+ username + "' "+password);

}


/**
 * Refresh the jwt auth token with still authed
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function refreshToken(req, res)
{
    let token = makeJWTToken(req.userID);
    res.status(200).send({ status: "ok", token: token});
}

/* ======================================================================================== */
// routes

/**
 * Check if authtoken is still valid
 */
router.get("/check", checkMw, noCacheMw , checkAuthReply);

/**
 * Log the user in
 */
router.post("/login", noCacheMw, login);

/**
 * Chache user password
 */
router.post("/changePassword", noCacheMw, checkMw, changePassword);

/**
 * Generate a new token for the current session
 */
router.get("/refreshToken", noCacheMw, checkMw, refreshToken);

/* ======================================================================================== */
// exports
exports.router = router;
exports.init = init;