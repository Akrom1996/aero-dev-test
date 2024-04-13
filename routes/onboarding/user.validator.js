exports.validateUserInfo = (req, res, next) => {
    if(!req.body || !req.body.id || !req.body.password){
        return res.status(422).json({
            status: 'FAILED',
            message: 'REQUIRED DATA WAS NOT SENT'
        })
    }
    next(); 
}