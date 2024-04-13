const jwt = require('jsonwebtoken');
const { pool } = require('../utils/connection.db');
require('dotenv').config();

exports.generateToken = (user) => {
    try {
        const payload = {
            id: user.id,
            password: user.password
        };
        const bearerToken = jwt.sign(
            payload,
            process.env.BEARER_TOKEN_KEY, {
                expiresIn: "10m"
            }
        );
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_KEY, {
                expiresIn: "1h"
            }
        );
        return Promise.resolve({
            bearer_token: bearerToken,
            refresh_token: refreshToken
        });
    } catch (err) {
        return Promise.reject(err);
    }
}

exports.verifyBearerToken = (bearerToken) => {
    return new Promise((resolve, reject) => {

        jwt.verify(bearerToken, process.env.BEARER_TOKEN_KEY, (err, tokenDetails) => {
            if (err)
                return reject("Invalid bearer token");
            resolve(
                tokenDetails
            );
        });
    });
}

exports.updateToken = async (token) => {
    try {
        const [blackListToken] = await pool.query('SELECT * FROM BLOCKED_TOKENS WHERE REFRESH_TOKEN = ?', token)
        if(JSON.parse(JSON.stringify(blackListToken)).length !== 0) throw new Error
        
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
        const {
            bearer_token,
            refresh_token
        } = await this.generateToken(decoded);

        return {
            id: decoded.id,
            bearer_token,
            refresh_token
        };
    } catch (error) {
        throw error;
    }
}