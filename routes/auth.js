const router = require('express').Router()
const User = require('../model/User')
const { registerValidation } = require('../validation')
const bcrpyt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth_middleware = require('./privateRoutes')
const auth_token = require('./privateRoutes')

const hashing_password = async (password) => {
    const salt = await bcrpyt.genSalt(10)
    const saltedPW = await bcrpyt.hash(password, salt)
    return saltedPW
}
router.post('/register', async (req, res) => {

    //use validation
    const validate = registerValidation(req.body)
    if(validate.error) return res.status(400).send(validate.error.details[0].message)

    const saltedPW = await hashing_password(req.body.password)

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
    if (user.length && req.body.password === req.body.password_confirmation){
            const match = await bcrpyt.compare(req.body.password, user[0].password)
            if(match){
                //create JWT token
                const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET)
                return res.header('auth-token', token).status(200).send({message: `Welcome back ${user[0].name}`, "auth-token" :token})
            } 
            return res.status(403).send({'msg':'It appears you may have made a mistake with your password, please try again.'})
    } 
    else res.status(404).send({'msg':'Email not found or passwords don\'t match'})
})

router.get('/', async (req, res) => {
    const all_users = await User.find().exec()
    res.status(200).send(all_users)
})

router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).exec()
    .catch(error => console.log(error))
    if(user) return res.status(200).send(user)
    return res.status(404).send({'msg':'User wasn\'t found'})
})

router.patch('/:id', auth_middleware, async (req, res) => {
    const user = await User.findById(req.params.id).exec()
    .catch(error => console.log(error))
    if(user){
        if(JSON.stringify(req.body) != '{}'){
            if(req.body.name != null){
                user.name = req.body.name
            }
            if(req.body.email != null){
                user.email = req.body.email
            }
            if(req.body.password != null){
                if(req.body.password === req.body.password_confirmation){
                    const saltedPW = await hashing_password(req.body.password)
                    user.password = saltedPW
                }
                else{ 
                    return res.status(403).send({message: 'passwords don\'t match'})
                }
            }
            try{
                const updatedUser = await user.save()
                res.send({updatedUser, message: 'User Updated!'})
            }catch(error) {
                res.status(400).send({ message: error.message})
            }
        }
        else{
            return res.status(500).send({ messsage: "Can\'t send empty request."})
        }
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const user = await User.findById(req.params.id).exec()
        if(user){
            await User.remove(user)
            res.send({ message: 'User removed.'})
        }
    }
    catch(error){
        return res.send(error)
    }
   
})
module.exports = router;

