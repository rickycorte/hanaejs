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


/* ======================================================================================== */
// init & conf

if(!process.env.RELEASE)
{
  require('dotenv').config();
  console.log(" ~ DEBUG ENV ~\n");
}
else
{
  console.log(" ~ RELEASE ENV ~\n");
}

const PORT = process.env.PORT || 8080;


const express = require('express');
const app = express();
const path = require('path');

const telegram = require('./telegram/core')


app.use(express.json())
app.use(express.static(path.join(__dirname, '../static')));

/* ======================================================================================== */
// routes

app.use(telegram.router);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/work_in_progress.html'));
  })

/* ======================================================================================== */
// errors

// Set 404 reply for all wrong routes
app.use((req, res, next) =>{

    let reply = { "status": "error", "message": "Check your data baka!" };
    res.status(404);
    res.send(reply);
  });


/* ======================================================================================== */
// app run
app.listen(PORT, async () => {
    console.log("Hanae JS is distributed under AGPL-3.0 (see LICENCE.md)");
    console.log("Copyright (C) 2019  RickyCorte (https://rickycorte.com)\n");

    console.log("Loading...");
    await telegram.init();

    console.log(`Listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });