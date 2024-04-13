const { pool } = require("../utils/connection.db")
const { verifyBearerToken } = require("./jwt.token")

exports.authenticate = async (req, res, next) => {
    if (!req.headers['authorization']) return res.status(500).json({
        result: 'SECURITY CREDENTIAL WAS NOT PROVIDED'
    })
    try {
        const auth = req.headers['authorization'].split(' ').pop() // SPLIT TOKEN FROM BEARER
        const payload = await verifyBearerToken(auth)
        const [token] = await pool.query('SELECT * FROM TOKENS WHERE user_id = ?', payload.id)
        const [blackListToken] = await pool.query('SELECT * FROM BLOCKED_TOKENS WHERE BEARER_TOKEN = ?', auth)
        if(JSON.parse(JSON.stringify(token)).length === 0 || JSON.parse(JSON.stringify(blackListToken)).length !== 0) throw new Error
        res.locals.payload = payload;
        next()
    } catch (error) {
        res.status(403).json({result: 'UNAUTHORIZED USER FORBIDDEN'})
    }
    
}