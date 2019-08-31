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


var jwt = require('jsonwebtoken');

/* ======================================================================================== */
// module

/**
 * Middaware to verity jwt token validity
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function verifyToken(req, res, next) {
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({status:"error", auth: false, message: 'No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET , function(err, decoded) {
    if (err)
    return res.status(500).send({status:"error", auth: false, message: 'Failed to authenticate token. ' + err });

    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });
}


/* ======================================================================================== */
// exports
module.exports = verifyToken;