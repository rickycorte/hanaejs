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

require('module-alias/register');

/* ======================================================================================== */
// Load debug env

if(!process.env.RELEASE)
{
  require("dotenv").config();
  console.log(" ~ DEBUG ENV ~\n");
}

/* ======================================================================================== */
// Imports

const express = require('express');
const path = require('path');
const morgan = require("morgan");

const database = require("./database/database");
const auth = require("./web/auth");

//const telegram = require('./telegram/bot');
//const webAPI = require("./web/webAPI");



/* ======================================================================================== */
// init & conf


const PORT = Number(process.env.PORT) || 8080;
const RELEASE = process.env.RELEASE || false;


const app = express();

function setupApp()
{  
  app.use(morgan("short"));

  app.use(express.json())
  app.use(express.static(path.join(__dirname, '../static')));
}

/* ======================================================================================== */
// routes


function setupRoutes()
{
  app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../static/work_in_progress.html'));
    });
}


/* ======================================================================================== */
// errors

function setupErrorHandlers()
{
  // Set 404 reply for all wrong routes
  app.use(require("./middleware/nonFound"));

  //setup generig 500 error for exceptions
  app.use(require("./middleware/exceptionHandler"));
}


/* ======================================================================================== */
// app runners


/**
 * Entry point of the program, run async inits here
 */
async function onAppStart()
{
  console.log("Hanae JS is distributed under AGPL-3.0 (see LICENCE.md)");
  console.log("Copyright (C) 2019  RickyCorte (https://rickycorte.com)\n");
  
  await database.init();
  await auth.init();
}


/**
 * This function is run when the express server is ready to listent to connections
 */
function onAppReady()
{
  console.log(`Listening on port ${PORT}`);
}


/**
 * Debug polling for local telegram debug
 * @param {*} end 
 */
function debugTelegramPolling(end)
{
  //run code
  end();
}


/**
 * Start the express server and (if debugging) telegram polling 
 */
function runApp()
{
  app.listen(PORT , onAppReady);

  if(!RELEASE)
  {
    const AsyncPolling = require('async-polling');
    AsyncPolling(debugTelegramPolling, 3000).run();
  }
}



/* ======================================================================================== */
// RUN APPLICATION

onAppStart()
.then(setupApp)
.then(setupRoutes)
.then(setupErrorHandlers)
.then(runApp);