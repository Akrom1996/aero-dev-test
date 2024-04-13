const express = require('express');
const {
  authenticate
} = require('../../security/authentication');
const {
  generateToken,
  updateToken,
  verifyBearerToken
} = require('../../security/jwt.token');
const {
  pool
} = require('../../utils/connection.db');
const {
  insertTokens
} = require('../../utils/tokens');
const {
  validateUserInfo
} = require('./user.validator');
const router = express.Router();


/* [POST] - запрос bearer токена по id и паролю */
router.post('/signin', validateUserInfo, async (req, res) => {
  try {
    const {
      id,
      password
    } = req.body;
    const [users] = await pool.query('SELECT * FROM USERS');
    const [tokens] = await pool.query('SELECT * FROM TOKENS');
    const filteredUser = JSON.parse(JSON.stringify(users)).find(user => user.id === id && user.password === password);
    if (!filteredUser)
      return res.status(200).json({
        result: 'USER NOT FOUND'
      })
    let tokenData = JSON.parse(JSON.stringify(tokens)).find(t => t.user_id === id);
    if (!tokenData) {
      tokenData = await generateToken(req.body);
      await insertTokens(tokenData.bearer_token, tokenData.refresh_token, req.body.id)
      return res.status(200).json({
        bearerToken: tokenData.bearer_token,
        refreshToken: tokenData.refresh_token,
      });
    }
    return res.status(200).json({
      bearerToken: tokenData.bearer_token
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }

});

/* [POST] - обновление bearer токена по refresh токену */
router.post('/signin/new_token', async (req, res) => {
  try {
    if (!req.body.refreshToken) return res.status(200).json({
      result: "TOKEN NOT PROVIDED"
    })
    const tokens = await updateToken(req.body.refreshToken)
    console.log(tokens)
    const [token] = await pool.query('SELECT * FROM TOKENS WHERE user_id = ?', [tokens.id]) // CHECK FROM DB
    console.log(JSON.parse(JSON.stringify(token)))
    if (JSON.parse(JSON.stringify(token)).length !== 0)
      await pool.query('UPDATE tokens SET bearer_token = ?, refresh_token = ? WHERE user_id = ?', [tokens.bearer_token, tokens.refresh_token, tokens.id])
    else await insertTokens(tokens.bearer_token, tokens.refresh_token, tokens.id)
    return res.status(200).json({
      bearerToken: tokens.bearer_token,
      refreshToken: tokens.refresh_token
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error: error.message
    })
  }

});

/* [POST] - регистрация нового пользователя */
router.post('/signup', validateUserInfo, async (req, res) => {
  try {
    const {
      bearer_token,
      refresh_token
    } = await generateToken(req.body);
    let sqlInsertUser = `INSERT INTO USERS (id, password) values (?, ?)`
    await pool.query(sqlInsertUser,
      [
        req.body.id,
        req.body.password
      ]
    );
    await insertTokens(bearer_token, refresh_token, req.body.id)
    return res.status(201).json({
      bearerToken: bearer_token,
      refreshToken: refresh_token
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }

})

/* [GET] - возвращает id пользователя; */
router.get('/info', authenticate, async (req, res) => {
  res.status(200).json({
    id: res.locals.payload.id,
  });
})

/* [GET] - выйти из системы */
router.get('/logout', authenticate, async (req, res) => {
  const [token] = await pool.query('SELECT * FROM TOKENS WHERE user_id = ?', res.locals.payload.id);
  const {
    bearer_token,
    refresh_token
  } = JSON.parse(JSON.stringify(token))[0];
  await pool.query('DELETE FROM TOKENS WHERE user_id = ?', [res.locals.payload.id]);
  await pool.query('INSERT INTO BLOCKED_TOKENS (bearer_token, refresh_token) VALUES (?, ?)', [bearer_token, refresh_token]);
  return res.status(200).json({
    result: 'SUCCESS'
  });
})

module.exports = router;