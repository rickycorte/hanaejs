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


function makeJWTToken(userID) {
    return jwt.sign(
        { id: userID },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_TOKEN_LIFETIME_SECONDS }
    );
}

/* ======================================================================================== */
// routes


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


async function login(req, res)
{

} 


/**
 * Check if authtoken is still valid
 */
router.get('auth/check', checkMw, noCacheMw , (req, res) => {

    res.status(200).send({
        result: "ok",
        auth: true,
        message: "Authenticated"
    });
});



/**
 * Log the user in
 */
router.post('auth/login', noCacheMw, async function (req, res) {

    try {
        console.log("Login request: %j", req.body);
        let usr = await db.isUserInDB(req.body["user"]);
        if(usr == true)
        {
            let token = makeJWTToken(req.body["user"]);
            res.status(200).send({ status: "ok", auth: true, token: token });
            console.log("Authenticated");
        }
        else
        {
            res.status(200).send({ status: "ok", auth: false});
            console.log("User not found");
        }
    }
    catch (err) {
        return res.status(400).send({
            result: "error",
            auth: false,
            message: "Please check your request data!" + err
        });
    }

});


/* ======================================================================================== */
// exports
exports.router = router;
exports.init = init;