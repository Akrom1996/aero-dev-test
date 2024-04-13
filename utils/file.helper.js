const {
    pool
} = require("./connection.db");

exports.getFile = async (id) => {
    const [file] = await pool.query('SELECT * FROM FILES WHERE id = ?', [id]);
    if (file.length === 0) throw new Error('FILE NOT FOUND')
    return JSON.parse(JSON.stringify(file))[0]
}