const router = require('express').Router()
const User = require('../model/User')
const { registerValidation } = require('../validation')
const bcrpyt = require('bcrypt')


router.post('/register', async (req, res) => {

    //use validation
    const validate = registerValidation(req.body)
    if(validate.error) return res.status(400).send(validate.error.details[0].message)

    const salt = await bcrpyt.genSalt(10)
    const saltedPW = await bcrpyt.hash(req.body.password, salt)

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: saltedPW
    })
    try{
        const new_user = await user.save()
        res.status(201).send(new_user)
    }
    catch(error){
        if(error.code === 11000){
            res.status(400).send("Email Already used")
        }
        else{
        res.status(400).send(error)
        }
    }
    
})

router.post('/login', async (req, res) => {
    const user = await User.find({'email': req.body.email}).exec()
    if (user.length){
        return res.send(user)
    } 
    else res.status(404).send('Email not found')
})

module.exports = router;

