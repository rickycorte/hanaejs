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
var path = require('path'); 
const db = require("./database");

const checkMw = require("./jwtMiddleware");

const router = express.Router();

const noCacheMw = require("./noCacheMiddleware");

/* ======================================================================================== */
// init & conf


router.get("/triggers", checkMw, noCacheMw, async (req, res) =>{

    let trg = await db.loadTriggersAndEvents();
    //console.log(trg);
    res.send(trg);
});


router.get("/login", (req, res)=> {
    res.sendFile(path.join(__dirname, '../../static/login.html'));
});

router.get("/", (req, res)=> {
    res.sendFile(path.join(__dirname, '../../static/manager.html'));
});


/* ======================================================================================== */
// exports
exports.router = router;