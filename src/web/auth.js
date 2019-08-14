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
const checkMw = require("./jwtMiddleware");
const noCacheMw = require("./noCacheMiddleware");
const db = require("./database");
const jwt = require('jsonwebtoken');

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


function init()
{
    db.init();
}

/**
 * Check if authtoken is still valid
 */
router.get('/check', checkMw, noCacheMw , (req, res) => {

    res.status(200).send({
        result: "ok",
        auth: true,
        message: "Authenticated"
    });
});



/**
 * Log the user in
 */
router.post('/login', noCacheMw, async function (req, res) {

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
            message: "Please check your request data!"
        });
    }

});


/* ======================================================================================== */
// exports
exports.init = init;
exports.router = router;