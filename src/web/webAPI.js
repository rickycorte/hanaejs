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



function hasDuplicateTrigger(triggers, name)
{
    let count = 0;

    for(let i = 0; i < triggers.length; i++)
    {
        if(triggers[i].name == name)
            count++;
    }

    return count == 1 ? false : true;
}



router.post("/update", checkMw, noCacheMw, async (req, res) => {


    let push_queue = {};

    try
    {

        //validate 

        let trg = req.body.triggers;
        
        for(let i = 0; i < trg.length; i++)
        {
            console.log(JSON.stringify(trg[i]));
            const name = trg[i].name;
            const rnm = trg[i].rnm;
            const inArr = trg[i].in;
            const outArr = trg[i].out;

            //check fields and type
            if(!name && typeof name != "string") throw "Missing 'name' property";

            if(rnm == undefined || typeof rnm != "boolean") throw "Missing 'rnm' property";

            if(!inArr || typeof inArr != "object") throw "Missing 'in' array";

            if(!outArr || typeof outArr != "object") throw "Missing 'out' array";

            //check duplicate trigger
            if(hasDuplicateTrigger(trg, name))  throw "Duplicate trigger '" + name + "' found";

            //check inner element types
            for(let j =0; j < inArr.length; j++)
            {
                if( typeof(inArr[j]) != "string")
                    throw "Typerr: 'in' elements must be strings";
            }

            for(let j = 0; j < outArr.length; j++)
            {
                if( typeof(outArr[j]) != "string")
                    throw "Typerr: 'out' elements must be strings";
            }

            //check length
            if(inArr.length < 1) throw "'in' array must have at least one element";

            if(outArr.length < 1) throw "'out' array must have at least one element";

            //create data to insert in db
            push_queue[name] = {"rnm": rnm, "in" : inArr, "out": outArr }

        }

    }
    catch(err)
    {
        // type error
        res.status(406).send({"status": "error", "message": "Type Error: unformatted json received - " + err});
        return;
    }


    
    //ok data is safe, proceed to insertion in db
    await db.updateTriggers(push_queue);

    res.status(200).send({"status" : "ok", "message": "Updated triggers"});


    //realod bot
    require('../telegram/bot').init();

});

/* ======================================================================================== */
// exports
exports.router = router;