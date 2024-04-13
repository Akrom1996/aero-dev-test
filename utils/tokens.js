const { pool } = require("./connection.db");

exports.insertTokens = async (bearerToken, refreshToken, id) => {
    let sqlInsertTokens = `INSERT INTO TOKENS (bearer_token, refresh_token, user_id) values (?, ?, ?)`
    return pool.query(sqlInsertTokens, [bearerToken, refreshToken, id]);
}
